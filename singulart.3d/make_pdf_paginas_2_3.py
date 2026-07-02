from PIL import Image
import os

base = os.path.dirname(os.path.abspath(__file__))

p2 = Image.open(os.path.join(base, 'singulart3d_p2.jpg')).convert('RGB')
p3 = Image.open(os.path.join(base, 'singulart3d_p3.jpg')).convert('RGB')

out = os.path.join(base, 'VER_MUDANCAS_PAGINAS_2_E_3.pdf')
p2.save(out, save_all=True, append_images=[p3], resolution=150.0)
print(f'PDF: {out}')
