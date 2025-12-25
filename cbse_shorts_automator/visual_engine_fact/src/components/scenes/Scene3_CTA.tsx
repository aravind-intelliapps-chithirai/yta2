import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';
import { USPBadge } from '../3d/USPBadge';
import { HandCursor } from '../3d/HandCursor';
import { HTMLTextOverlay } from '../overlays/HTMLTextOverlay';

export const Scene3_CTA: React.FC<{ scenario: FactScenario; theme: Theme; slateZ: number; slateWidth: number }> = ({ 
    scenario, theme, slateZ, slateWidth 
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const tCtaFrame = scenario.timings.t_cta * fps;
    const tOutroFrame = scenario.timings.t_outro * fps;

    // White out transition logic
    const whiteOut = interpolate(
        frame,
        [tOutroFrame - 15, tOutroFrame],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
        <>
            <group position={[0, 0, slateZ]}>
                <pointLight position={[0, 0, 2]} intensity={interpolate(frame, [tCtaFrame, tCtaFrame + 30], [0, 5])} color="white" />
                <USPBadge theme={theme} seed={scenario.meta.theme_seed} tCtaFrame={tCtaFrame} slateWidth={slateWidth} />
                <HandCursor theme={theme} tCtaFrame={tCtaFrame} slateZ={0} />
            </group>

            {/* CTA Overlays Reusing Scene 2 Logic */}
            <HTMLTextOverlay 
                scenario={{...scenario, content: {...scenario.content, fact_body_html: scenario.content.cta_content.social_text}}}
                theme={theme}
                boxStartPercent={0.1} // Top Position
                {...{} as any} // Fill other props as per your mapping
            />
            
            {frame > tCtaFrame + 60 && (
                <HTMLTextOverlay 
                    scenario={{...scenario, content: {...scenario.content, fact_body_html: scenario.content.cta_content.link_text}}}
                    theme={theme}
                    boxStartPercent={0.8} // Bottom Position
                    {...{} as any}
                />
            )}

            {/* Global White-out Overlay */}
            <AbsoluteFill style={{ backgroundColor: 'white', opacity: whiteOut, pointerEvents: 'none' }} />
        </>
    );
};