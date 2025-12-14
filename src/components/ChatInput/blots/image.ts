import { Quill } from "react-quill";

// Import the default Image blot
const Image = Quill.import("formats/image");

// Extend the default Image blot
class CustomImageBlot extends Image {
  static blotName = "image"; // Keep the same blot name to override
  static tagName = "img"; // Keep the same tag name
  static className = "im-image-blot"; // Apply your custom class

  // Override create to potentially add default attributes or classes
  static create(value: string): Node {
    const node = super.create(value) as HTMLImageElement;
    // Add your custom class directly to the DOM node
    node.classList.add(CustomImageBlot.className);
    // Set default alt if needed, though the insert operation can override it
    if (!node.hasAttribute("alt")) {
      node.setAttribute("alt", "image");
    }
    // Optional: Add default styles or other attributes
    // node.style.maxWidth = '100%';
    // node.style.height = 'auto';
    return node;
  }

  // Optional: Override formats if you need to store the class or other custom attrs in the delta
  // formats(domNode: Element): Record<string, any> {
  //   const formats = super.formats(domNode);
  //   formats['class'] = domNode.getAttribute('class'); // Example
  //   return formats;
  // }
}

export default CustomImageBlot;
