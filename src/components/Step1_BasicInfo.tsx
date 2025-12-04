'use client';
import { useProposalStore } from '../../src/lib/store';
import { LucideMapPin } from 'lucide-react';
import styles from '@/app/page.module.css'; // 스타일 공유

export default function Step1_BasicInfo() {
  const store = useProposalStore();
  return (
    <div>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepBadge}>1</span> 기본 정보
      </h3>
      <div className={styles.card}>
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>업체명</label>
            <input
              type="text"
              className={styles.input}
              value={store.clientName}
              onChange={(e) => store.setClientName(e.target.value)}
            />
          </div>
          <div>
            <label className={styles.label}>제안 일자</label>
            <input
              type="date"
              className={styles.input}
              value={store.targetDate}
              onChange={(e) => store.setTargetDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={styles.label}>현장 주소</label>
          <div className={styles.inputIconWrap}>
            <LucideMapPin size={16} className={styles.inputIcon} />
            <input
              type="text"
              className={styles.inputWithIcon}
              value={store.address}
              onChange={(e) => store.setAddress(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
