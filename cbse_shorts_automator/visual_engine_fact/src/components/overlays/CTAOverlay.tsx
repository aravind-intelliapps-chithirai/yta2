import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';
import { HTMLTextOverlay } from './HTMLTextOverlay'; // Reuse your logic
import { S3_CTA_CONFIG } from '../../constants';

interface Props {
    scenario: FactScenario;
    theme: Theme;
}

export const CTAOverlay: React.FC<Props> = ({ scenario, theme }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const tCtaFrame = scenario.timings.t_cta * fps;
    const localFrame = frame - tCtaFrame;

    // Timing for Card 2 (Link)
    const card2Start = tCtaFrame + (S3_CTA_CONFIG.LINK_CARD_DELAY * fps);

    return (
        <AbsoluteFill>
            {/* CARD 1: Social Text (Top) */}
            <HTMLTextOverlay 
                scenario={{
                    ...scenario, 
                    content: {
                        ...scenario.content, 
                        fact_body_html: scenario.content.cta_content.social_text
                    }
                }}
                theme={theme}
                boxStartPercent={0.15} // Top position logic
                // Ensure this uses the same decoded HTML logic as Fact Body
            />

            {/* CARD 2: Link Text (Bottom) */}
            {frame > card2Start && (
                <HTMLTextOverlay 
                    scenario={{
                        ...scenario, 
                        content: {
                            ...scenario.content, 
                            fact_body_html: scenario.content.cta_content.link_text
                        }
                    }}
                    theme={theme}
                    boxStartPercent={0.78} // Bottom position logic
                />
            )}
        </AbsoluteFill>
    );
};