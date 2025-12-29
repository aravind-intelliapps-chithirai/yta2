import type * as R3F from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends R3F.JSX.IntrinsicElements {}
  }
}

export {};