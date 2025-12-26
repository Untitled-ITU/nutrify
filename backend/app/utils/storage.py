from urllib.parse import quote
from flask import current_app


def build_image_url(image_name, folder="img"):
    if not image_name:
        return

    base_url = current_app.config['FIREBASE_STORAGE_BASE_URL']
    if not base_url:
        return

    path = f"{folder}/{image_name}"
    encoded_path = quote(path, safe='')

    return f"{base_url}/{encoded_path}?alt=media"
