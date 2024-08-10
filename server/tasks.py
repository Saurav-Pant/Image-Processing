import io
from PIL import Image, ImageEnhance, ImageFilter
from config import get_s3_client, BUCKET_NAME

s3 = get_s3_client()

def resize_image(image: Image.Image, size: tuple) -> Image.Image:
    return image.resize(size)

def apply_filter(image: Image.Image, filter_type: str) -> Image.Image:
    if filter_type == 'blur':
        return image.filter(ImageFilter.BLUR)
    elif filter_type == 'sharpen':
        return image.filter(ImageFilter.SHARPEN)
    elif filter_type == 'edge_enhance':
        return image.filter(ImageFilter.EDGE_ENHANCE)
    else:
        return image

def adjust_brightness(image: Image.Image, factor: float) -> Image.Image:
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)

def process_image(file_key: str, operations: list) -> str:
    response = s3.get_object(Bucket=BUCKET_NAME, Key=file_key)
    image_data = response['Body'].read()
    image = Image.open(io.BytesIO(image_data))

    for operation in operations:
        if operation['type'] == 'resize':
            image = resize_image(image, operation['size'])
        elif operation['type'] == 'filter':
            image = apply_filter(image, operation['filter_type'])
        elif operation['type'] == 'brightness':
            image = adjust_brightness(image, operation['factor'])

    output = io.BytesIO()
    image.save(output, format='JPEG')
    output.seek(0)

    processed_key = f"processed_{file_key}"
    s3.put_object(Bucket=BUCKET_NAME, Key=processed_key, Body=output)

    return processed_key
