
import DataClass from './DataClass';

/**
 * Based on https://schema.org/ImageObject (but not identical - eg uses `id`)
 */
class ImageObject extends DataClass {
	author;
	url;
	license;	
}
DataClass.register(ImageObject, "ImageObject");
const This = ImageObject;
export default ImageObject;


