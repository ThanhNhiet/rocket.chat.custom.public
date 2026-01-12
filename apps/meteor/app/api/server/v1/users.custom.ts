import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';
import { API } from '../api';

API.v1.addRoute(
	'me.scrmservice', 
	{ authRequired: true }, 
	{
		async get() {
		const userId = this.userId;

		if (!userId) {
			return API.v1.failure('Not logged in');
		}

		const user = await Meteor.users.findOneAsync(
			{ _id: userId },
			{ fields: { services: 1, username: 1 } }
		);

		if (!user) {
			return API.v1.failure('User not found');
		}

		return API.v1.success({
			username: user.username,
			services: user.services.suitecrm || {},
		});
		},

		async put() {
			const userId = this.userId;

			if (!userId) {
				return API.v1.failure('Not logged in');
			}

			const { access_token, refresh_token } = this.bodyParams;

			if (!access_token || !refresh_token) {
				return API.v1.failure('Missing required token parameters');
			}

			try {
				// Decode JWT to get payload
				const tokenParts = access_token.split('.');
				if (tokenParts.length !== 3) {
					return API.v1.failure('Invalid access token format');
				}

				const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
				const { sub: id, exp } = payload;

				if (!id || !exp) {
					return API.v1.failure('Invalid token payload');
				}

				// Calculate expiresAt: (exp - 60) * 1000
				const expiresAt = Math.floor((exp - 60) * 1000);

				// Get current user to preserve existing suitecrm data
				const currentUser = await Users.findOneById(userId, {
					projection: { 'services.suitecrm': 1 }
				});

				const existingSuiteCrm = currentUser?.services?.suitecrm || {};

				// Update services.suitecrm while preserving existing fields
				const updatedSuiteCrm = {
					...existingSuiteCrm,
					accessToken: access_token,
					refreshToken: refresh_token,
					id,
					expiresAt,
				};

				await Users.updateOne(
					{ _id: userId },
					{
						$set: {
							'services.suitecrm': updatedSuiteCrm
						}
					}
				);

				return API.v1.success({
					message: 'SuiteCRM tokens updated successfully'
				});

			} catch (error) {
				return API.v1.failure('Failed to decode access token or update user');
			}
		},
	},
);