import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';
import { Slide, Theme } from './presentationService';

export const exportService = {
  async exportToPDF(slides: Slide[], theme?: Theme, filename: string = 'presentation.pdf'): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080]
    });

    for (let i = 0; i < slides.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const canvas = await this.slideToCanvas(slides[i], theme);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
    }

    pdf.save(filename);
  },

  async exportToImages(slides: Slide[], theme?: Theme): Promise<void> {
    for (let i = 0; i < slides.length; i++) {
      const canvas = await this.slideToCanvas(slides[i], theme);
      const link = document.createElement('a');
      link.download = `slide-${i + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  },

  async exportToPowerPoint(slides: Slide[], theme?: Theme, filename: string = 'presentation.pptx'): Promise<void> {
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';

    for (const slide of slides) {
      const pptxSlide = pptx.addSlide();

      const bgColor = this.getBackgroundColor(slide, theme);
      if (bgColor) {
        pptxSlide.background = { color: bgColor };
      }

      if (slide.gradient || theme?.background_gradient) {
        const gradient = slide.gradient || theme?.background_gradient;
        pptxSlide.background = { fill: gradient };
      }

      if (slide.backgroundImage) {
        pptxSlide.background = { path: slide.backgroundImage };
      }

      const textOptions: any = {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 3,
        align: 'center',
        valign: 'middle',
        fontSize: theme?.font_size || 48,
        color: this.hexToRgb(theme?.text_color || '#FFFFFF'),
        fontFace: theme?.font_family || 'Arial',
        bold: false,
        breakLine: true
      };

      if (theme?.text_shadow) {
        textOptions.shadow = {
          type: 'outer',
          blur: 8,
          offset: 2,
          angle: 45,
          color: '000000',
          opacity: 0.8
        };
      }

      if (slide.reference) {
        pptxSlide.addText(slide.reference, {
          ...textOptions,
          y: 1.5,
          h: 0.5,
          fontSize: (theme?.font_size || 48) * 0.6,
          color: this.hexToRgb(theme?.text_color || '#FFFFFF'),
          transparency: 20
        });
      }

      pptxSlide.addText(slide.content, textOptions);
    }

    await pptx.writeFile({ fileName: filename });
  },

  async slideToCanvas(slide: Slide, theme?: Theme): Promise<HTMLCanvasElement> {
    const container = document.createElement('div');
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = '80px';
    container.style.textAlign = 'center';
    container.style.fontFamily = theme?.font_family || 'Inter';
    container.style.fontSize = `${theme?.font_size || 48}px`;
    container.style.color = theme?.text_color || '#FFFFFF';
    container.style.textShadow = theme?.text_shadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none';

    if (slide.backgroundImage) {
      container.style.backgroundImage = `linear-gradient(rgba(0,0,0,${theme?.overlay_opacity || 0.3}), rgba(0,0,0,${theme?.overlay_opacity || 0.3})), url(${slide.backgroundImage})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    } else if (slide.gradient || theme?.background_gradient) {
      container.style.background = slide.gradient || theme?.background_gradient || '#000000';
    } else {
      container.style.backgroundColor = slide.backgroundColor || theme?.background_color || '#000000';
    }

    const content = document.createElement('div');
    content.style.maxWidth = '1600px';

    if (slide.reference) {
      const reference = document.createElement('div');
      reference.textContent = slide.reference;
      reference.style.fontSize = `${(theme?.font_size || 48) * 0.6}px`;
      reference.style.marginBottom = '30px';
      reference.style.opacity = '0.9';
      content.appendChild(reference);
    }

    const text = document.createElement('div');
    text.textContent = slide.content;
    text.style.whiteSpace = 'pre-wrap';
    text.style.lineHeight = '1.5';
    content.appendChild(text);

    container.appendChild(content);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      width: 1920,
      height: 1080,
      scale: 1,
      backgroundColor: null
    });

    document.body.removeChild(container);

    return canvas;
  },

  getBackgroundColor(slide: Slide, theme?: Theme): string | null {
    if (slide.backgroundColor) {
      return slide.backgroundColor.replace('#', '');
    }
    if (theme?.background_color) {
      return theme.background_color.replace('#', '');
    }
    return null;
  },

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'FFFFFF';
    return result[1] + result[2] + result[3];
  },

  async importFromPowerPoint(file: File): Promise<Slide[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const slides: Slide[] = [];

          alert('PowerPoint import is a complex feature that requires server-side processing. For now, please use the manual slide creation tools.');

          resolve(slides);
        } catch (error) {
          console.error('Error importing PowerPoint:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
};
