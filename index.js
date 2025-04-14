class Observe {
    constructor(className) {
      this.targets = Array.from(document.getElementsByClassName(className));
      this.options = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
      };
      this.paletteCache = new Map();
  
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.options);
      this.targets.forEach((el) => this.observer.observe(el));
    }
  
    handleIntersection(entries) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
  
        const img = entry.target;
        const frame = img.closest('.frame');
        const bg = document.querySelector('.bg');
        const pr = document.querySelector('.pr');
        const se = document.querySelector('.se');
        const src = img.src;
  
        if (this.paletteCache.has(src)) {
          this.applyColors(this.paletteCache.get(src), frame, bg, pr, se);
        } else {
          const paletteGen = new GetColorPalette(5, 10);
          paletteGen.initialize(src)
            .then((palette) => {
              this.paletteCache.set(src, palette);
              this.applyColors(palette, frame, bg, pr, se);
            })
            .catch(console.error);
        }
      });
    }
  
    applyColors(palette, frame, bg, pr, se) {
      const applyStyle = (el, color) => {
        if (!el) return;
        el.style.transition = 'background 0.8s ease-in-out';
        el.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      };
  
      const updateCircle = (className, color) => {
        const li = document.querySelector(`.${className}`);
        if (!li) return;
  
        const circle = li.querySelector('.color-circle');
        const text = li.querySelector('.color-text');
  
        if (circle) {
          circle.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        }
        if (text) {
          const hex = this.rgbToHex(color[0], color[1], color[2]);
          text.textContent = `${hex}`;
          text.setAttribute('data-hex', hex);
          text.classList.remove('copied');
          text.onclick = () => {
            navigator.clipboard.writeText(hex).then(() => {
              text.classList.add('copied');
              setTimeout(() => text.classList.remove('copied'), 1500);
            });
          };
        }
      };
  
      applyStyle(frame, palette.primaryColor);
      applyStyle(bg, palette.backgroundColor);
      applyStyle(pr, palette.primaryColor);
      applyStyle(se, palette.secondaryColor);
  
      updateCircle('bg', palette.backgroundColor);
      updateCircle('pr', palette.primaryColor);
      updateCircle('se', palette.secondaryColor);
    }
  
    rgbToHex(r, g, b) {
      return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  
  class GetColorPalette {
    constructor(beta, delta) {
      this.beta = beta;
      this.delta = delta;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  
    initialize(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = 'anonymous';
  
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          const data = this.ctx.getImageData(0, 0, img.width, img.height).data;
          const palette = this.getPalette(data);
          resolve(palette);
        };
  
        img.onerror = reject;
      });
    }
  
    getPalette(data) {
      const colors = [];
      const count = {};
  
      for (let i = 0; i < data.length; i += 4 * this.beta) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const rgb = [r, g, b];
  
        const isNew = !colors.some(([cr, cg, cb]) => {
          const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
          return dist < this.delta;
        });
  
        if (isNew) colors.push(rgb);
  
        const key = rgb.toString();
        count[key] = (count[key] || 0) + 1;
      }
  
      const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
      const toRGB = (str) => str.split(',').map(Number);
  
      return {
        backgroundColor: toRGB(sorted[0][0]),
        primaryColor: toRGB(sorted[Math.floor(sorted.length * 0.66)][0] || sorted[0][0]),
        secondaryColor: toRGB(sorted[Math.floor(sorted.length * 0.33)][0] || sorted[0][0]),
      };
    }
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    console.clear();
    new Observe('targetImage');
  });
  