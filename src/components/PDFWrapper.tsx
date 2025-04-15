import jsPDF, { DocumentProperties } from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import PDFObject from "pdfobject";

export interface PdfWrapperOptions {
  x?: number;
  y?: number;
  lineSpacing?: number;
  header?: string;
  subHeader?: string;
  leftFooter?: string;
  rightFooter?: string;
  centerFooter?: string;
  orient?: "l" | "p";
}
export interface PrintOptions {
  x?: number;
  y?: number;
  fontName?: string;
  color?: string;
  fontSize?: number;
  fontStyle?: string;
  fontWeight?: string | number;
  align?: "left" | "center" | "right" | "justify";
  link?: { pageNumber?: number; url?: string; top?: number; zoom?: number; };
  maxWidth?: number;
}

interface NewPageOptions {
  header?: boolean;
  footer?: boolean;
  format?: string | number[];
  orientation?: "p" | "portrait" | "l" | "landscape";
}
export interface SvgOptions {
  svg: string;
  x: number;
  y: number;
  w: number;
  h: number;
  alias?: string;
  compression?: boolean;
  rotation?: number;
}
export default class PdfWrapper {
  private pdf: jsPDF;
  private lineSpacing: number;
  private header: string;
  private subHeader: string;
  private leftFooter: string;
  private rightFooter: string;
  private centerFooter: string;
  private cursorPos = { x: 10, y: 10 };
  private currentOrientation: "p" | "portrait" | "l" | "landscape" | undefined =
    undefined;
  private onNextPage: () => void = () => { };
  constructor(options: PdfWrapperOptions) {
    const {
      x,
      y,
      lineSpacing,
      header,
      subHeader,
      leftFooter,
      rightFooter,
      centerFooter,
      orient,
    } = options;
    this.pdf = new jsPDF({
      unit: "pt",
      orientation: orient || "l",
    });
    this.pdf.setFont("Helvetica", "normal", "normal");
    this.currentOrientation = orient || "l";
    this.cursorPos.x = x || 10;
    this.cursorPos.y = y || 10;
    this.lineSpacing = lineSpacing || 5;
    this.header = header || "";
    this.subHeader = subHeader || "";
    this.leftFooter = leftFooter || "";
    this.rightFooter = rightFooter || "";
    this.centerFooter = centerFooter || "";
  }
  setPageHeader(callback: () => void) {
    this.onNextPage = callback;
    this.pdf.internal.events.subscribe("addPage", () => {
      this.onNextPage();
    });
  }

  addImage(
    imageData: string | HTMLImageElement | HTMLCanvasElement,
    options: {
      format?:
      | "JPEG"
      | "PNG"
      | "WEBP"
      | "TIFF"
      | "BMP"
      | "SVG"
      | "PDF"
      | "JPEG2000"
      | "RAW";
      x: number;
      y: number;
      w: number;
      h: number;
      rotation?: number;
    }
  ) {
    this.pdf.addImage(
      imageData,
      options.format || "JPEG",
      options.x,
      options.y,
      options.w,
      options.h,
      undefined,
      "NONE",
      options.rotation
    );
  }
  addSvgImage(options: SvgOptions) {
    this.pdf.addSvgAsImage(
      options.svg,
      options.x,
      options.y,
      options.w,
      options.h,
      options.alias,
      options.compression,
      options.rotation
    );
  }
  getPdfInstance() {
    return this.pdf;
  }
  initPage(
    opts: { header: boolean; footer: boolean; } = { header: true, footer: true }
  ) {
    this.cursorPos.x = 10;
    this.cursorPos.y = 10;
    if (opts.header) this.printHeader();
    if (opts.footer) this.printSubHeader();
  }
  setHeader(content: string) {
    this.header = content;
    this.printHeader();
  }
  setSubHeader(content: string) {
    this.subHeader = content;
    this.printSubHeader();
  }
  setLeftFooter(content: string) {
    this.leftFooter = content;
  }
  setRightFooter(content: string) {
    this.rightFooter = content;
  }
  setCenterFooter(content: string) {
    this.centerFooter = content;
  }
  setCurrentPos({
    x = this.cursorPos.x,
    y = this.cursorPos.y,
    autoNextPage = false,
  } = {}) {
    this.cursorPos.y = y + this.pdf.getFontSize();
    if (x) this.cursorPos.x = x;
    if (this.cursorPos.y >= this.getPageHeight() - 40 && autoNextPage) {
      this.newPage({ orientation: this.currentOrientation });
    }
  }
  printHeader() {
    if (!this.header) return;
    this.pdf.setFont("times", "normal", "bold");
    this.pdf.setFontSize(20);
    this.pdf.text(this.header, this.cursorPos.x, this.cursorPos.y + 20);
    this.cursorPos.x = 10;
    this.cursorPos.y += this.pdf.getFontSize() + this.lineSpacing;
  }
  printSubHeader() {
    if (!this.subHeader) return;
    this.pdf.setFontSize(14);
    this.pdf.setFont("times", "normal", "normal");
    this.pdf.text(
      this.subHeader,
      this.cursorPos.x,
      this.cursorPos.y + this.pdf.getFontSize()
    );
    this.cursorPos.y += this.pdf.getFontSize() + this.lineSpacing + 5;
    this.printDivider();
  }
  printDivider() {
    const y = this.cursorPos.y + 8;
    this.pdf.line(10, y, this.getPageWidth() - 10, y);
    this.setCurrentPos({ y });
  }
  printText(content: string, options: PrintOptions = { color: "black" }) {
    if (!content) return;
    const {
      x,
      y,
      fontName,
      fontSize,
      fontStyle,
      align,
      fontWeight,
      link,
      maxWidth,
    } = options;
    this.pdf.setFontSize(fontSize || 12);
    this.pdf.setTextColor(options.color || "black");
    this.pdf.setFont(
      fontName || "Helvetica",
      fontStyle || "normal",
      fontWeight || "normal"
    );
    if (link) {
      this.pdf.textWithLink(
        content,
        x || this.cursorPos.x,
        y || this.cursorPos.y,
        {
          ...link,
        }
      );
    } else {
      this.pdf.text(content, x || this.cursorPos.x, y || this.cursorPos.y, {
        align: align || "left",
        maxWidth,
      });
    }
    this.setCurrentPos({ x, y });
  }
  createTable(data: UserOptions) {
    autoTable(this.pdf, {
      didDrawPage: (data) => {
        this.setCurrentPos({
          x: data.cursor?.x || this.getCurrentPos().x,
          y: data.cursor?.y || this.getCurrentPos().y,
        });
      },
      ...data,
    });
  }
  getPageWidth() {
    return this.pdf.internal.pageSize.width;
  }
  getPageHeight() {
    return this.pdf.internal.pageSize.height;
  }
  printFooter(fromPageNumber = 3) {
    if (!this.rightFooter) return;
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = fromPageNumber; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setTextColor("#00000055");
      this.pdf.setFontSize(8);
      this.pdf.setFont("Helvetica", "normal", "normal");
      const leftFooterContent = this.leftFooter
        .replace("{PAGENUM}", i.toString())
        .replace("{PAGES}", totalPages.toString());
      const rightFooterContent = this.rightFooter
        .replace("{PAGENUM}", i.toString())
        .replace("{PAGES}", totalPages.toString());
      const centerFooterContent = this.centerFooter
        .replace("{PAGENUM}", i.toString())
        .replace("{PAGES}", totalPages.toString());
      this.pdf.line(
        10,
        this.getPageHeight() - 34,
        this.getPageWidth() - 10,
        this.getPageHeight() - 34
      );
      if (this.leftFooter) {
        this.pdf.text(leftFooterContent, 20, this.getPageHeight() - 20, {
          align: "left",
        });
      }
      if (this.rightFooter) {
        this.pdf.text(
          rightFooterContent,
          this.getPageWidth() - 20,
          this.getPageHeight() - 20,
          {
            align: "right",
          }
        );
      }
      if (this.centerFooter) {
        this.pdf.text(
          centerFooterContent,
          this.getPageWidth() / 2,
          this.getPageHeight() - 20,
          {
            align: "center",
          }
        );
      }
    }
  }
  newPage(options?: NewPageOptions) {
    const { format, orientation } = options || {};
    this.currentOrientation = orientation || "landscape";
    this.pdf.addPage(format || "A4", this.currentOrientation);
    // this.onNextPage()
    // this.initPage({ header: Boolean(header), footer: Boolean(footer) })
  }
  export(filename: string) {
    this.pdf.save(filename);
  }
  toArrayBuffer() {
    return this.pdf.output("arraybuffer");
  }
  toBlob() {
    return this.pdf.output("blob");
  }
  setProperties(options: DocumentProperties) {
    this.pdf.setDocumentProperties(options);
  }
  preview(target: string) {
    // const embededData = this.pdf.output('datauristring', { filename })
    const embededData = this.pdf.output("blob");
    PDFObject.embed(window.URL.createObjectURL(embededData), target);
    // const viewer = new PdfViewer(target)
    // viewer.render({ src: embededData, export: () => this.export(filename) })
  }
  getCurrentPage() {
    return this.pdf.getCurrentPageInfo().pageNumber;
  }
  getCurrentPos() {
    return this.cursorPos;
  }
  setPage(pageNumber: number) {
    this.pdf.setPage(pageNumber);
  }
  rect(x: number, y: number, w: number, h: number, style: string) {
    this.pdf.rect(x, y, w, h, style);
  }
  line(x1: number, y1: number, x2: number, y2: number) {
    this.pdf.line(x1, y1, x2, y2);
  }
}
