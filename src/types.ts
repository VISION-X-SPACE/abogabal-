/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  detailedPoints: string[];
  category: 'legal' | 'realestate';
  icon: string;
}

export interface Article {
  id: string;
  title: string;
  introduction: string;
  paragraphs: string[];
  category: 'قوانين وأنظمة' | 'تطوير عقاري' | 'شركات ناشئة';
  date: string;
  readTime: string;
  author: string;
}

export interface CalculatorOption {
  label: string;
  value: string;
  description?: string;
  recommendationPoints: {
    llc?: number; // شركة ذات مسؤولية محدودة
    sole?: number; // مؤسسة فردية
    simplifiedJointStock?: number; // شركة مساهمة مبسطة
    partnership?: number; // شركة تضامنية
  };
}

export interface CalculatorQuestion {
  id: string;
  text: string;
  description: string;
  options: CalculatorOption[];
}

export interface SecureFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: 'encrypting' | 'encrypted' | 'under_review' | 'processed';
  key: string;
  notes?: string;
}

export interface ConsultationRequest {
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  message: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'welcome' | 'confirmation' | 'reminder' | 'system';
}

