import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onItemClick(): void {
    // Automatically close sidebar when navigation/link is clicked on mobile
    if (window.innerWidth <= 768) {
      this.close.emit();
    }
  }
}