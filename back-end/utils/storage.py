"""
Supabase Storage backend for Django.
Integrates Supabase Storage with Django's File Storage API.
"""
import re
import uuid
import logging
from urllib.parse import quote
from django.conf import settings
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from supabase import create_client

logger = logging.getLogger(__name__)


class SupabaseStorage(Storage):
    """
    Custom storage backend for Supabase Storage.

    Uses SUPABASE_URL, SUPABASE_KEY, and SUPABASE_BUCKET from Django settings.
    Files are stored in the 'products/images/' folder within the bucket.
    """

    def __init__(self, bucket_name=None, folder_prefix="products/images/"):
        self.bucket_name = bucket_name or getattr(settings, "SUPABASE_BUCKET", None)
        self.folder_prefix = folder_prefix

        supabase_url = getattr(settings, "SUPABASE_URL", None)
        supabase_key = getattr(settings, "SUPABASE_KEY", None)

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured in Django settings."
            )

        self.supabase_url = supabase_url.rstrip("/")
        self.client = create_client(supabase_url, supabase_key)

    def _get_full_path(self, name):
        """Get the full path in Supabase storage including folder prefix.

        Normalise Windows backslashes to forward slashes so Supabase never
        receives an invalid key like 'products/images/products\\file.jpg'.
        """
        # Replace any backslashes (Windows path separators) with forward slashes
        name = name.replace("\\", "/")
        if name.startswith(self.folder_prefix):
            return name
        return f"{self.folder_prefix}{name}"

    def _save(self, name, content):
        """
        Save the file to Supabase Storage.

        Returns:
            The full path of the saved file (used by Django to call .url() later)
        """
        full_path = self._get_full_path(name)

        if hasattr(content, "read"):
            file_content = content.read()
        else:
            file_content = content

        try:
            self.client.storage.from_(self.bucket_name).upload(
                full_path,
                file_content,
                {"content-type": getattr(content, "content_type", "image/jpeg")}
            )
            logger.info(f"Successfully uploaded file to Supabase: {full_path}")
            return full_path

        except Exception as e:
            logger.error(f"Error uploading file to Supabase: {e}")
            raise

    def _open(self, name, mode="rb"):
        """Open a file from Supabase Storage."""
        full_path = self._get_full_path(name)

        try:
            response = self.client.storage.from_(self.bucket_name).download(full_path)
            return ContentFile(response)

        except Exception as e:
            logger.error(f"Error downloading file from Supabase: {e}")
            raise

    def exists(self, name):
        """Check if a file exists in Supabase Storage."""
        full_path = self._get_full_path(name)

        try:
            folder = full_path.rsplit("/", 1)[0]
            file_name = full_path.rsplit("/", 1)[1]
            response = self.client.storage.from_(self.bucket_name).list(folder)
            return any(file["name"] == file_name for file in response)

        except Exception as e:
            logger.error(f"Error checking file existence in Supabase: {e}")
            return False

    def url(self, name):
        """
        Get the public URL for a file in Supabase Storage.

        FIX: get_public_url() returns either a plain string (newer supabase-py)
        or a dict {'publicUrl': '...'} (older versions). We handle both so
        image_url in the DB is always a clean string that Next.js can load.

        URL encodes the path to handle spaces and special characters properly.
        """
        # Validate that name is not empty
        if not name or not name.strip():
            logger.error("Cannot generate URL for empty file name")
            return ""

        full_path = self._get_full_path(name)
        # Encode each path segment separately to preserve forward slashes
        encoded_path = '/'.join(quote(segment, safe='') for segment in full_path.split('/'))

        try:
            response = self.client.storage.from_(self.bucket_name).get_public_url(full_path)

            # Newer supabase-py (>= 1.0) → plain string
            if isinstance(response, str):
                # If the response contains spaces, re-encode it properly
                if ' ' in response or '%20' in response:
                    # Extract the path from the URL and re-encode
                    base_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}"
                    return f"{base_url}/{encoded_path}"
                return response

            # Older supabase-py → dict with 'publicUrl' key
            if isinstance(response, dict):
                url = response.get("publicUrl") or response.get("data", {}).get("publicUrl", "")
                if url and (' ' in url or '%20' in url):
                    base_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}"
                    return f"{base_url}/{encoded_path}"
                return url

            # Fallback: build the URL manually with proper encoding
            return (
                f"{self.supabase_url}"
                f"/storage/v1/object/public/{self.bucket_name}/{encoded_path}"
            )

        except Exception as e:
            logger.error(f"Error getting public URL from Supabase: {e}")
            # Safe fallback — build URL directly with proper encoding
            return (
                f"{self.supabase_url}"
                f"/storage/v1/object/public/{self.bucket_name}/{encoded_path}"
            )

    def delete(self, name):
        """Delete a file from Supabase Storage."""
        full_path = self._get_full_path(name)

        try:
            self.client.storage.from_(self.bucket_name).remove([full_path])
            logger.info(f"Successfully deleted file from Supabase: {full_path}")

        except Exception as e:
            logger.error(f"Error deleting file from Supabase: {e}")
            raise

    def get_valid_name(self, name):
        """
        Return a safe filename for Supabase Storage.

        FIX: The original replaced ALL special chars with '_', which mangled
        filenames like "ChatGPT Image Apr 21, 2026, 08_44_42 PM.png" into
        a path that didn't match what Supabase actually stored, breaking
        get_public_url(). Now we:
          1. Strip leading/trailing whitespace
          2. Replace spaces with underscores (only spaces, not commas/dots)
          3. Remove characters that are truly unsafe in URLs
          4. Preserve dots (for file extensions) and hyphens
        """
        # Split extension to protect it
        if "." in name:
            base, ext = name.rsplit(".", 1)
        else:
            base, ext = name, ""

        # Replace spaces and unsafe chars (commas, brackets, etc.) with underscore
        base = base.strip()
        base = re.sub(r"[^\w\-]", "_", base)    # unsafe char → _

        # Collapse consecutive underscores into one  ← fixes "Apr_21__2026__"
        base = re.sub(r"_+", "_", base)

        # Strip leading/trailing underscores
        base = base.strip("_")

        if ext:
            ext = re.sub(r"[^\w]", "", ext)     # sanitize extension
            return f"{base}.{ext}"

        return base

    def get_available_name(self, name, max_length=None):
        """Return a filename that is available in the storage."""
        if not self.exists(name):
            return name

        # File exists → add a short unique suffix before the extension
        if "." in name:
            base, ext = name.rsplit(".", 1)
            unique_name = f"{base}_{uuid.uuid4().hex[:8]}.{ext}"
        else:
            unique_name = f"{name}_{uuid.uuid4().hex[:8]}"

        return unique_name