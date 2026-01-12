import { Box } from '@rocket.chat/fuselage';
import { ActionLink } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

const POWERED_BY_URL = null;
const POWERED_BY_TEXT = null;

export const LoginPoweredBy = (): ReactElement | null => {
    const hidePoweredBy = useSetting('Layout_Login_Hide_Powered_By', false);

    if (hidePoweredBy) {
        return null;
    }

    // Kiểm tra xem có đủ thông tin custom không
    const hasCustomBranding = POWERED_BY_URL && POWERED_BY_TEXT;

    return (
        <Box mbe={18}>
            {hasCustomBranding ? (
                <Trans>
                    <ActionLink href={POWERED_BY_URL} target='_blank' rel='noopener noreferrer'>
                        {POWERED_BY_TEXT}
                    </ActionLink>
                </Trans>
            ) : (
                <Trans i18nKey='registration.page.poweredBy'>
                    {'Powered by '}
                    <ActionLink href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
                        Rocket.Chat
                    </ActionLink>
                </Trans>
            )}
        </Box>
    );
};

export default LoginPoweredBy;