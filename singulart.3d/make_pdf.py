from PIL import Image
import os

base = os.path.dirname(os.path.abspath(__file__))

p1 = Image.open(os.path.join(base, 'singulart3d_p1.jpg')).convert('RGB')
p2 = Image.open(os.path.join(base, 'singulart3d_p2.jpg')).convert('RGB')
p3 = Image.open(os.path.join(base, 'singulart3d_p3.jpg')).convert('RGB')

out = os.path.join(base, 'singulart3d_carta.pdf')
p1.save(out, save_all=True, append_images=[p2, p3], resolution=150.0)
print(f'PDF: {out}')
