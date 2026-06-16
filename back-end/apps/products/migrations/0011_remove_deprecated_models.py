# Generated manually to remove deprecated models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_add_unified_variants_v2'),
        ('orders', '0001_initial'),  # OrderItem references ProductVariant
    ]

    operations = [
        # Remove ProductImage model (replaced by ProductColorVariant.image)
        migrations.DeleteModel(
            name='ProductImage',
        ),
        # Remove ProductVariant model (replaced by ProductSizeVariant)
        migrations.DeleteModel(
            name='ProductVariant',
        ),
        # Remove ProductVariantV2 model (replaced by ProductColorVariant + ProductSizeVariant)
        migrations.DeleteModel(
            name='ProductVariantV2',
        ),
    ]
