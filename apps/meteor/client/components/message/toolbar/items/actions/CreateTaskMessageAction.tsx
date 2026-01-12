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
	TextInput
} from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, memo } from 'react';

import MessageToolbarItem from '../../MessageToolbarItem';

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
	const taskNameField = useId();
	const taskDescField = useId();
	
	const rcUid = getCookie("rc_uid");
	const rcToken = getCookie("rc_token");

	const handleCreateTask = () => {
		// TODO: Implement actual task creation logic here
		console.log("Creating task...");
		console.log("User ID:", rcUid);
		console.log("Auth Token:", rcToken);
		console.log("Message ID:", message._id);
		onClose();
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>Create Task</ModalTitle>
				<ModalClose onClick={onClose} title="Close" />
			</ModalHeader>
			<ModalContent>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={taskNameField}>Task Name</FieldLabel>
						<FieldRow>
							<TextInput id={taskNameField} placeholder="Enter task name..." defaultValue={message.msg} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={taskDescField}>Description</FieldLabel>
						<FieldRow>
							<TextInput id={taskDescField} placeholder="Enter task description..." />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>Debug Information</FieldLabel>
						<Box p="x16">
							<Box mb="x8">
								<strong>User ID (rc_uid):</strong> {rcUid || 'Not found'}
							</Box>
							<Box mb="x8">
								<strong>Auth Token (rc_token):</strong> {rcToken ? `${rcToken.substring(0, 10)}...` : 'Not found'}
							</Box>
							<Box>
								<strong>Message ID:</strong> {message._id}
							</Box>
						</Box>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup>
					<Button onClick={onClose}>Cancel</Button>
					<Button primary onClick={handleCreateTask}>
						Create Task
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

const CreateTaskMessageAction = ({ message, room, subscription }: CreateTaskMessageActionProps) => {
	const setModal = useSetModal();

	const handleClick = () => {
		console.log("User ID:", getCookie("rc_uid"));
		console.log("Auth Token:", getCookie("rc_token"));
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
			title="Create Task"
			qa="create-task"
			onClick={handleClick}
		/>
	);
};

export default memo(CreateTaskMessageAction);