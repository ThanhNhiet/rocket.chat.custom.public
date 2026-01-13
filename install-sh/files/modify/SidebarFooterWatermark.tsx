import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { BRANDING } from '../../brandingConfig';

export const SidebarFooterWatermark = (): ReactElement | null => {

    // Nếu cấu hình tắt watermark thì return null luôn
    if (!BRANDING.SHOW_WATERMARK) {
        return null;
    }

    return (
        <Box pi={16} pbe={8}>
            <Box is='a' href={BRANDING.POWERED_BY_LINK} target='_blank' rel='noopener noreferrer'>
                
                <Box fontScale='micro' color='hint' pbe={4}>
                    {BRANDING.POWERED_BY}
                </Box>

                {/* {BRANDING.EXTRA_INFO && (
                    <Box fontScale='micro' color='default' pbe={4}>
                        {BRANDING.EXTRA_INFO}
                    </Box>
                )} */}

            </Box>
        </Box>
    );
};