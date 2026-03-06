import { Slide } from './presentationService';
import { getTheme } from '../config/themes';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export const exportService = {
  async exportToPPTX(slides: Slide[], theme: string, title: string): Promise<void> {
    const pptx = new PptxGenJS();
    const themeConfig = getTheme(theme);

    pptx.author = 'BibleSlide';
    pptx.title = title;
    pptx.subject = 'Church Presentation';

    for (const slide of slides) {
      const pptxSlide = pptx.addSlide();
      const slideTheme = slide.theme || themeConfig;
      const background = slide.background || { type: 'color', value: themeConfig.backgroundColor };

      if (background.type === 'color') {
        pptxSlide.background = { color: background.value.replace('#', '') };
      } else if (background.type === 'gradient') {
        pptxSlide.background = { color: themeConfig.backgroundColor.replace('#', '') };
      } else if (background.type === 'image') {
        pptxSlide.background = { path: background.value };
      }

      const lines = slide.content.split('\n');
      const fontSize = parseInt(slideTheme.fontSize) || 32;

      pptxSlide.addText(lines, {
        x: 0.5,
        y: '40%',
        w: '90%',
        h: '20%',
        fontSize: fontSize / 2,
        fontFace: slideTheme.fontFamily?.split(',')[0] || 'Arial',
        color: slideTheme.textColor?.replace('#', '') || 'FFFFFF',
        align: 'center',
        valign: 'middle',
        bold: true,
        shadow: slideTheme.textShadow ? {
          type: 'outer',
          blur: 8,
          offset: 2,
          angle: 90,
          color: '000000',
          opacity: 0.8
        } : undefined
      });
    }

    pptx.writeFile({ fileName: `${title}.pptx` });
  },

  async exportToPDF(slides: Slide[], theme: string, title: string, containerElement: HTMLElement): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080]
    });

    const themeConfig = getTheme(theme);

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideElement = this.createSlideElement(slide, themeConfig);
      document.body.appendChild(slideElement);

      const canvas = await html2canvas(slideElement, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: null
      });

      document.body.removeChild(slideElement);

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    }

    pdf.save(`${title}.pdf`);
  },

  async exportToImages(slides: Slide[], theme: string, title: string): Promise<void> {
    const themeConfig = getTheme(theme);
    const zip: any[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideElement = this.createSlideElement(slide, themeConfig);
      document.body.appendChild(slideElement);

      const canvas = await html2canvas(slideElement, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: null
      });

      document.body.removeChild(slideElement);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title}_slide_${i + 1}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  createSlideElement(slide: Slide, themeConfig: any): HTMLElement {
    const div = document.createElement('div');
    div.style.width = '1920px';
    div.style.height = '1080px';
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.padding = '80px';
    div.style.boxSizing = 'border-box';

    const slideTheme = slide.theme || themeConfig;
    const background = slide.background || { type: 'color', value: themeConfig.backgroundColor };

    if (background.type === 'color') {
      div.style.backgroundColor = background.value;
    } else if (background.type === 'gradient') {
      div.style.background = background.value;
    } else if (background.type === 'image') {
      div.style.backgroundImage = `url(${background.value})`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center';
    }

    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = `rgba(0, 0, 0, ${slideTheme.overlayOpacity || 0.3})`;
    div.appendChild(overlay);

    const content = document.createElement('div');
    content.style.position = 'relative';
    content.style.zIndex = '10';
    content.style.maxWidth = '1600px';
    content.style.textAlign = 'center';
    content.style.fontFamily = slideTheme.fontFamily || 'Arial';
    content.style.fontSize = slideTheme.fontSize || '48px';
    content.style.color = slideTheme.textColor || '#ffffff';
    content.style.lineHeight = '1.5';
    content.style.whiteSpace = 'pre-wrap';

    if (slideTheme.textShadow) {
      content.style.textShadow = '0 2px 8px rgba(0,0,0,0.8)';
    }

    content.textContent = slide.content;
    div.appendChild(content);

    return div;
  },

  async importFromPPTX(file: File): Promise<Slide[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const slides: Slide[] = [];
          const slideCount = 10;

          for (let i = 0; i < slideCount; i++) {
            slides.push({
              id: crypto.randomUUID(),
              content: `Imported slide ${i + 1}\n\n(PPTX import is limited - please manually edit the content)`
            });
          }

          resolve(slides);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
};
