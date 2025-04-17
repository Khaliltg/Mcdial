// src/lib/types.ts

export interface ActivityItem {
    type: 'call' | 'campaign' | 'alert'; // Restrict possible types
    icon: string; // e.g., 'bi-telephone-fill'
    text: string;
    time: string;
}
