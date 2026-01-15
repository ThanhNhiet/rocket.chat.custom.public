import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { 
	Modal, 
	Box, 
	ButtonGroup, 
	Button, 
	ModalHeader, 
	ModalTitle, 
	ModalClose, 
	ModalContent, 
	ModalFooter,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	TextInput,
	Select
} from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, memo, useState, useEffect } from 'react';

import MessageToolbarItem from '../../MessageToolbarItem';

const RC_URL = 'https://chat.oceanfleet.tech';

type SCRMService = {
	serverURL: string;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	id: string;
};

type TaskPermission = {
	access_override: number;
	access_level_name: string;
};

type ModalState = {
	isLoading: boolean;
	canCreateTask: boolean;
	errorMessage: string;
	scrmService: SCRMService | null;
};

type CreateTaskMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

type CreateTaskModalProps = {
	message: IMessage;
	onClose: () => void;
};

const getCookie = (name: string) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift();
	return null;
};

const CreateTaskModal = ({ message, onClose }: CreateTaskModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const taskNameField = useId();
	const taskDescField = useId();
	const taskPriorityField = useId();
	
	const [modalState, setModalState] = useState<ModalState>({
		isLoading: true,
		canCreateTask: false,
		errorMessage: '',
		scrmService: null
	});
	
	const [taskData, setTaskData] = useState({
		name: message.msg,
		description: '',
		priority: 'Medium'
	});
	
	const rcUid = getCookie("rc_uid");
	const rcToken = getCookie("rc_token");

	useEffect(() => {
		const initializeSCRM = async () => {
			try {
				setModalState(prev => ({ ...prev, isLoading: true, errorMessage: '' }));
				
				// Get SCRM service info
				const response = await fetch(`${RC_URL}/api/v1/me.scrmservice`, {
					headers: {
						'X-Auth-Token': rcToken || '',
						'X-User-Id': rcUid || ''
					}
				});
				
				if (!response.ok) {
					throw new Error('Failed to fetch SCRM service');
				}
				
				const data = await response.json();
				
				// Check if services is empty
				if (!data.services || Object.keys(data.services).length === 0 || !data.services._OAuthCustom) {
					setModalState(prev => ({
						...prev,
						isLoading: false,
						canCreateTask: false,
						errorMessage: t('scrm_task_err_notsignin')
					}));
					return;
				}
				
				let scrmService = {
					serverURL: data.services.serverURL,
					accessToken: data.services.accessToken,
					refreshToken: data.services.refreshToken,
					expiresAt: data.services.expiresAt,
					id: data.services.id
				};
				
				// Check if token is expired
				const now = Date.now();
				if (now >= scrmService.expiresAt) {
					// Token expired, refresh it
					scrmService = await refreshAccessToken(scrmService);
				}
				
				// Check task permissions
				const hasPermission = await checkTaskPermissions(scrmService);
				
				setModalState({
					isLoading: false,
					canCreateTask: hasPermission,
				errorMessage: hasPermission ? '' : t('scrm_task_err_notallow'),
					scrmService
				});
			} catch (error) {
				console.error('SCRM initialization error:', error);
				setModalState(prev => ({
					...prev,
					isLoading: false,
					canCreateTask: false,
					errorMessage: t('scrm_task_err_connection')
				}));
			}
		};
		
		if (rcUid && rcToken) {
			initializeSCRM();
		} else {
			setModalState(prev => ({
				...prev,
				isLoading: false,
				canCreateTask: false,
				errorMessage: 'Authentication required'
			}));
		}
	}, [rcUid, rcToken]);
	
	const refreshAccessToken = async (service: SCRMService): Promise<SCRMService> => {
		// Get client credentials
		const secretResponse = await fetch(`${service.serverURL}/custom/public/api/get_secret_oauth.php`);
		if (!secretResponse.ok) {
			throw new Error('Failed to get client credentials');
		}
		const { client_id, client_secret } = await secretResponse.json();
		
		// Refresh token
		const tokenResponse = await fetch(`${service.serverURL}/Api/access_token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				grant_type: 'refresh_token',
				client_id,
				client_secret,
				refresh_token: service.refreshToken
			})
		});
		
		if (!tokenResponse.ok) {
			throw new Error('Failed to refresh token');
		}
		
		const tokenData = await tokenResponse.json();
		
		// Update tokens in Rocket.Chat
		const updateResponse = await fetch(`${RC_URL}/api/v1/me.scrmservice`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': rcToken || '',
				'X-User-Id': rcUid || ''
			},
			body: JSON.stringify(tokenData)
		});
		
		if (!updateResponse.ok) {
			throw new Error('Failed to update tokens');
		}
		
		return {
			...service,
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			expiresAt: Date.now() + (tokenData.expires_in * 1000)
		};
	};
	
	const checkTaskPermissions = async (service: SCRMService): Promise<boolean> => {
		const response = await fetch(`${service.serverURL}/Api/V8/custom/user/${service.id}/roles-task`, {
			headers: {
				'Authorization': `Bearer ${service.accessToken}`
			}
		});
		
		if (!response.ok) {
			return false;
		}
		
		const data = await response.json();
		
		// If no roles are configured (empty roles array), default is to allow all access
		if (!data.roles || data.roles.length === 0 || data.total_roles === 0) {
			return true;
		}
		
		// Check for access permission in configured roles
		for (const role of data.roles) {
			for (const action of role.actions || []) {
				if (action.name === 'access' && action.category === 'Tasks') {
					const accessOverride = action.access_override;
					return accessOverride !== -98 && accessOverride !== -99;
				}
			}
		}
		
		// If roles exist but no specific access permission found, deny access
		return false;
	};

	const handleCreateTask = async () => {
		if (!modalState.scrmService || !modalState.canCreateTask || !taskData.name.trim()) {
			return;
		}
		
		try {
			setModalState(prev => ({ ...prev, isLoading: true }));
			
			const response = await fetch(`${modalState.scrmService.serverURL}/api/V8/module`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${modalState.scrmService.accessToken}`
				},
				body: JSON.stringify({
					data: {
						type: 'Tasks',
						attributes: {
							name: taskData.name,
							description: taskData.description,
							priority: taskData.priority
						}
					}
				})
			});
			
			if (response.status === 201) {
				dispatchToastMessage({
					type: 'success',
					message: t('scrm_task_create_success')
				});
				onClose();
			} else {
				throw new Error('Failed to create task');
			}
			
		} catch (error) {
			console.error('Create task error:', error);
			setModalState(prev => ({
				...prev,
				isLoading: false,
				errorMessage: t('scrm_task_create_fail')
			}));
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('scrm_task_create_title')}</ModalTitle>
				<ModalClose onClick={onClose} title="Close" />
			</ModalHeader>
			<ModalContent>
				{modalState.isLoading && (
					<Box p="x16" textAlign="center">
						Loading SCRM connection...
					</Box>
				)}
				
				{modalState.errorMessage && (
					<Box p="x16" color="status-font-on-warning" borderRadius="x2">
						⚠️ {modalState.errorMessage}
					</Box>
				)}
				
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={taskNameField}>{t('scrm_task_name_label')}</FieldLabel>
						<FieldRow>
							<TextInput 
								id={taskNameField} 
								placeholder={t('scrm_task_name_placeholder')} 
								value={taskData.name}
								onChange={(e) => setTaskData(prev => ({ ...prev, name: e.target.value }))}
								disabled={modalState.isLoading || !modalState.canCreateTask}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={taskDescField}>{t('scrm_task_description_label')}</FieldLabel>
						<FieldRow>
							<TextInput 
								id={taskDescField} 
								placeholder={t('scrm_task_description_placeholder')} 
								value={taskData.description}
								onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
								disabled={modalState.isLoading || !modalState.canCreateTask}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={taskPriorityField}>{t('scrm_task_priority_label')}</FieldLabel>
						<FieldRow>
							<Select 
								id={taskPriorityField} 
								value={taskData.priority}
								aria-label="Priority"
								options={[
									["Low", t('scrm_task_priority_low')],
									["Medium", t('scrm_task_priority_medium')],
									["High", t('scrm_task_priority_High')]
								]}
								onChange={(value) => setTaskData(prev => ({ ...prev, priority: value as string }))}
								disabled={modalState.isLoading || !modalState.canCreateTask}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup>
					<Button onClick={onClose} disabled={modalState.isLoading}>{t('scrm_task_cancel_btn')}</Button>
					<Button 
						primary 
						onClick={handleCreateTask}
						disabled={modalState.isLoading || !modalState.canCreateTask || !taskData.name.trim()}
					>
						{modalState.isLoading ? 'Processing...' : t('scrm_task_create_btn')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

const CreateTaskMessageAction = ({ message, room, subscription }: CreateTaskMessageActionProps) => {
	const setModal = useSetModal();
	const t = useTranslation();

	const handleClick = () => {
		setModal(
			<CreateTaskModal
				message={message}
				onClose={() => {
					setModal(null);
				}}
			/>
		);
	};

	return (
		<MessageToolbarItem
			id="create-task"
			icon="plus"
				title={t('scrm_task_create_title')}
			qa="create-task"
			onClick={handleClick}
		/>
	);
};

export default memo(CreateTaskMessageAction);