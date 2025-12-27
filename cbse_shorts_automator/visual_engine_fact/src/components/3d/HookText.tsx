{!hasCollided && ( 
                    <Billboard position={[HookTextPosX+ vibrationX, HookTextPosY+ vibrationY, HookTextPosZ]}>
                     <Center    key={hookText}  > {/* Apply your desired position here */}   
                         <Text3D
                            font={staticFile("assets/fonts/Anton.json")} 
                            size={1.3}
                            height={0.2}
                            curveSegments={12}
                            bevelEnabled
                            bevelThickness={0.1}
                            bevelSize={0.05}
                            bevelOffset={0}
                            bevelSegments={5}
                            scale={animatedScale}
                        >
                            {hookText}
                            <meshStandardMaterial
                                attach="material-0"
                                color={theme.text_header_3d} // White
                                roughness={0.1} // Mirror-like polish
                                metalness={0.8}
                            />

                            {/* MATERIAL 1: SIDES / BEVEL (Neon Glow) */}
                            {/* Glows with the theme color, visible even in dark tunnel */}
                            <meshStandardMaterial
                                attach="material-1"
                                color={theme.accent_primary}
                                emissive={theme.accent_primary}
                                emissiveIntensity={0.8}
                                roughness={0.4}
                            />
                        </Text3D>
                        </Center>
                    </Billboard>
                )}