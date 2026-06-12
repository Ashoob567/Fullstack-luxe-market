# Generated manually for performance optimization
# Date: 2026-06-05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_alter_category_image_alter_productimage_image'),
    ]

    operations = [
        # Add indexes to Category model
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['slug'], name='cat_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['is_active'], name='cat_active_idx'),
        ),

        # Add indexes to Product model
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['is_active', '-created_at'], name='prod_active_created_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['is_active', 'is_featured'], name='prod_active_featured_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['is_active', 'is_flash_sale'], name='prod_active_flash_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['category', 'is_active'], name='prod_cat_active_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['slug'], name='prod_slug_idx'),
        ),
    ]
