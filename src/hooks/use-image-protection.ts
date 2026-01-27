/**
 * use-image-protection - Three-layer image protection hook
 * 
 * LAYER 1 - FIRST PAINT (HTML Attributes):
 * Add these to image HTML for instant protection (before JS loads):
 * <img 
 *   src="..." 
 *   draggable="false" 
 *   onContextMenu="return false"
 *   class="protected-image" 
 * />
 * 
 * LAYER 2 - GLOBAL CSS (Add to your stylesheet for first paint):
 * img.protected-image {
 *   -webkit-user-drag: none;
 *   user-select: none;
 *   -webkit-user-select: none;
 *   -webkit-touch-callout: none;
 * }
 * 
 * LAYER 3 - PROGRESSIVE ENHANCEMENT (JavaScript):
 * Use this hook for additional event blocking on older browsers
 * 
 * Disables: right-click context menu, drag behavior, text selection
 * Preserves: accessibility, page scrolling, keyboard navigation, UI interactions
 */

import { useEffect, useRef } from 'react';

interface UseImageProtectionOptions {
  enabled?: boolean;
  showMessage?: boolean;
}

/**
 * Apply soft image protection to an image element
 * 
 * REQUIRED: Also add these HTML attributes to your image element:
 * <img ref={imageRef} draggable="false" onContextMenu="return false" />
 * 
 * Features:
 * - Disables right-click context menu
 * - Prevents image dragging
 * - Prevents text selection
 * - Blocks mobile save/share long-press menu
 * - Preserves accessibility (keyboard, screen readers)
 * - Works on desktop and mobile
 */
export const useImageProtection = (
  options: UseImageProtectionOptions = {}
) => {
  const { enabled = true, showMessage = false } = options;
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!enabled || !imageRef.current) return;

    const imgElement = imageRef.current;

    // Handler for right-click context menu suppression
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (showMessage) {
        // eslint-disable-next-line no-console
        console.log('Image protection: Right-click disabled');
      }
      return false;
    };

    // Handler for drag prevention
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (showMessage) {
        // eslint-disable-next-line no-console
        console.log('Image protection: Drag disabled');
      }
      return false;
    };

    // Handler for text selection prevention
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handler for mouse down on right-click
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // right-click
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add event listeners with capture phase
    imgElement.addEventListener('contextmenu', handleContextMenu as EventListener, true);
    imgElement.addEventListener('dragstart', handleDragStart as EventListener, true);
    imgElement.addEventListener('selectstart', handleSelectStart as EventListener, true);
    imgElement.addEventListener('mousedown', handleMouseDown, true);

    // Apply CSS protection immediately on mount
    // (HTML attributes provide instant protection, JS ensures fallback coverage)
    imgElement.style.userSelect = 'none';
    imgElement.style.webkitUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (imgElement.style as any).webkitTouchCallout = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (imgElement.style as any).webkitUserDrag = 'none';
    imgElement.draggable = false;

    return () => {
      imgElement.removeEventListener('contextmenu', handleContextMenu as EventListener, true);
      imgElement.removeEventListener('dragstart', handleDragStart as EventListener, true);
      imgElement.removeEventListener('selectstart', handleSelectStart as EventListener, true);
      imgElement.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [enabled, showMessage]);

  return imageRef;
};

/**
 * Apply protection to a container of images
 * 
 * REQUIRED: Add these attributes to your images inside the container:
 * <img draggable="false" onContextMenu="return false" />
 * 
 * Useful for gallery containers where you want to protect multiple images
 */
export const useGalleryImageProtection = (
  options: UseImageProtectionOptions = {}
) => {
  const { enabled = true, showMessage = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const images = container.querySelectorAll('img');

    // Handler for right-click context menu suppression
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        if (showMessage) {
          // eslint-disable-next-line no-console
          console.log('Image protection: Right-click disabled');
        }
      }
    };

    // Handler for drag prevention
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        if (showMessage) {
          // eslint-disable-next-line no-console
          console.log('Image protection: Drag disabled');
        }
      }
    };

    // Handler for text selection prevention
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Handler for mouse down on right-click
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Apply CSS-based protection to all images in container on mount
    // (HTML attributes provide instant protection, this JS ensures fallback)
    images.forEach((img) => {
      img.style.userSelect = 'none';
      img.style.webkitUserSelect = 'none';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (img.style as any).webkitTouchCallout = 'none';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (img.style as any).webkitUserDrag = 'none';
      img.draggable = false;
    });

    // Add container-level event listeners with capture phase (event delegation)
    container.addEventListener('contextmenu', handleContextMenu as EventListener, true);
    container.addEventListener('dragstart', handleDragStart as EventListener, true);
    container.addEventListener('selectstart', handleSelectStart as EventListener, true);
    container.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu as EventListener, true);
      container.removeEventListener('dragstart', handleDragStart as EventListener, true);
      container.removeEventListener('selectstart', handleSelectStart as EventListener, true);
      container.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [enabled, showMessage]);

  return containerRef;
};
