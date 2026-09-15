import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewChecked {

  messages: Message[] = [];

  @ViewChild('chatContainer')
  private chatContainer!: ElementRef<HTMLElement>;

  private shouldScrollToBottom = false;

  /*
   * Stores the content currently showing
   * the "Copied" state.
   */
  copiedMessage: string | null = null;

  /*
   * Stores the content currently showing
   * the "Downloaded" state.
   */
  downloadedMessage: string | null = null;


  // ==========================================
  // ADD MESSAGE
  // ==========================================

  addMessage(message: Message): void {

    if (!message) {
      return;
    }

    this.messages.push(message);

    /*
     * Wait until Angular renders the new
     * message before scrolling.
     */
    this.shouldScrollToBottom = true;
  }


  // ==========================================
  // AFTER VIEW CHECKED
  // ==========================================

  ngAfterViewChecked(): void {

    if (!this.shouldScrollToBottom) {
      return;
    }

    this.scrollToBottom();

    this.shouldScrollToBottom = false;
  }


  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  private scrollToBottom(): void {

    if (!this.chatContainer) {
      return;
    }

    const element =
      this.chatContainer.nativeElement;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }


  // ==========================================
  // COPY TEXT
  // ==========================================

  async copyText(text: string): Promise<void> {

    if (!text) {
      return;
    }

    try {

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {

        await navigator.clipboard.writeText(text);

      } else {

        this.copyTextFallback(text);
      }

      this.showCopiedState(text);

    } catch (error) {

      console.error(
        'Failed to copy text:',
        error
      );

      /*
       * Try the fallback if the modern
       * clipboard API fails.
       */
      try {

        this.copyTextFallback(text);

        this.showCopiedState(text);

      } catch (fallbackError) {

        console.error(
          'Fallback copy failed:',
          fallbackError
        );
      }
    }
  }


  // ==========================================
  // TEXT COPY FALLBACK
  // ==========================================

  private copyTextFallback(text: string): void {

    const textarea =
      document.createElement('textarea');

    textarea.value = text;

    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand('copy');

    document.body.removeChild(textarea);
  }


  // ==========================================
  // COPIED STATE
  // ==========================================

  private showCopiedState(
    content: string
  ): void {

    this.copiedMessage = content;

    window.setTimeout(() => {

      if (this.copiedMessage === content) {
        this.copiedMessage = null;
      }

    }, 1600);
  }


  // ==========================================
  // DOWNLOAD TEXT
  // ==========================================

  downloadText(text: string): void {

    if (!text) {
      return;
    }

    const blob = new Blob(
      [text],
      {
        type: 'text/plain;charset=utf-8'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      `ai-response-${Date.now()}.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    this.showDownloadedState(text);
  }


  // ==========================================
  // COPY IMAGE
  // ==========================================

  async copyImage(
    base64: string
  ): Promise<void> {

    if (!base64) {
      return;
    }

    try {

      const blob =
        this.base64ToBlob(
          base64,
          'image/png'
        );

      if (
        navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {

        const item =
          new ClipboardItem({
            'image/png': blob
          });

        await navigator.clipboard.write([
          item
        ]);

        this.showCopiedState(base64);

        return;
      }

      console.warn(
        'Image clipboard is not supported by this browser.'
      );

    } catch (error) {

      console.error(
        'Failed to copy image:',
        error
      );
    }
  }


  // ==========================================
  // DOWNLOAD IMAGE
  // ==========================================

  downloadImage(
    base64: string
  ): void {

    if (!base64) {
      return;
    }

    try {

      const blob =
        this.base64ToBlob(
          base64,
          'image/png'
        );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `generated-image-${Date.now()}.png`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      this.showDownloadedState(base64);

    } catch (error) {

      console.error(
        'Failed to download image:',
        error
      );
    }
  }


  // ==========================================
  // DOWNLOADED STATE
  // ==========================================

  private showDownloadedState(
    content: string
  ): void {

    this.downloadedMessage = content;

    window.setTimeout(() => {

      if (
        this.downloadedMessage === content
      ) {
        this.downloadedMessage = null;
      }

    }, 1600);
  }


  // ==========================================
  // BASE64 → BLOB
  // ==========================================

  private base64ToBlob(
    base64: string,
    contentType: string
  ): Blob {

    const byteCharacters =
      atob(base64);

    const byteArrays: BlobPart[] = [];

    const sliceSize = 1024;

    for (
      let offset = 0;
      offset < byteCharacters.length;
      offset += sliceSize
    ) {

      const slice =
        byteCharacters.slice(
          offset,
          offset + sliceSize
        );

      const byteNumbers =
        new Array<number>(
          slice.length
        );

      for (
        let i = 0;
        i < slice.length;
        i++
      ) {

        byteNumbers[i] =
          slice.charCodeAt(i);
      }

      byteArrays.push(
        new Uint8Array(byteNumbers)
      );
    }

    return new Blob(
      byteArrays,
      {
        type: contentType
      }
    );
  }

}