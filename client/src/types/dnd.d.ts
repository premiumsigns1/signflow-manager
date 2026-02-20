declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    combine: null | {
      draggableId: string;
      droppableId: string;
    };
  }

  export interface DragDropContextProps {
    children: React.ReactNode;
    onDragEnd: (result: DropResult) => void;
    onDragStart?: (initial: any) => void;
    onDragUpdate?: (update: any) => void;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: any;
    placeholder: React.ReactNode;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith: string | null;
    draggingFromThisWith: string | null;
    isUsingPlaceholder: boolean;
  }

  export interface DroppableProps {
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
    droppableId: string;
    type?: string;
    direction?: 'horizontal' | 'vertical';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    getContainerForClone?: any;
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: any;
    dragHandleProps: any | null;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    isClone: boolean;
    dropAnimation: any | null;
    draggingOver: string | null;
    combineWith: string | null;
    combineTargetFor: string | null;
    mode: 'FLUID' | 'SNAP' | null;
  }

  export interface DraggableProps {
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
  }

  export const DragDropContext: React.FC<DragDropContextProps>;
  export const Droppable: React.FC<DroppableProps>;
  export const Draggable: React.FC<DraggableProps>;
  
  export default DragDropContext;
}
