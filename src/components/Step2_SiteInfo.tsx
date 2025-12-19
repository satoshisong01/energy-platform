'use client';
import { useProposalStore } from '../../src/lib/store';
import { LucidePlus, LucideTrash2 } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function Step2_SiteInfo() {
  const store = useProposalStore();

  // 640W 모듈 기준 수량 계산: (용량kW * 1000) / 640
  const panelCount =
    store.capacityKw > 0 ? Math.round((store.capacityKw * 1000) / 640) : 0;

  return (
    <div>
      <div className={styles.roofHeader}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
          <span className={styles.stepBadge}>2</span> 설치 공간
        </h3>
        <button onClick={store.addRoofArea} className={styles.addButton}>
          <LucidePlus size={14} /> 추가
        </button>
      </div>
      {store.roofAreas.map((area, index) => (
        <div key={area.id} className={styles.roofItem}>
          <div className={styles.roofIndex}>{index + 1}</div>
          <input
            type="text"
            placeholder="구역명"
            className={styles.inputBare}
            value={area.name}
            onChange={(e) =>
              store.updateRoofArea(area.id, 'name', e.target.value)
            }
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              width: '120px',
            }}
          >
            <input
              type="number"
              className={styles.inputBare}
              style={{ textAlign: 'right' }}
              value={area.valueM2 || ''}
              onChange={(e) =>
                store.updateRoofArea(area.id, 'valueM2', Number(e.target.value))
              }
            />
            <span className={styles.roofUnit}>m²</span>
          </div>
          {store.roofAreas.length > 1 && (
            <button
              onClick={() => store.removeRoofArea(area.id)}
              className={styles.deleteButton}
            >
              <LucideTrash2 size={16} />
            </button>
          )}
        </div>
      ))}
      <div className={styles.summaryBadge}>
        <div>
          <div className={styles.summaryLabel}>전체 평수</div>
          <div className={styles.summaryValue}>
            {store.totalAreaPyeong.toLocaleString()}{' '}
            <span className={styles.summaryUnit}>평</span>
          </div>
        </div>
        <div
          style={{
            textAlign: 'right',
            borderLeft: '1px solid rgba(255,255,255,0.3)',
            paddingLeft: '1rem',
          }}
        >
          <div className={styles.summaryLabel}>설치 용량 (수정가능)</div>
          <div
            className={styles.summaryValue}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
            }}
          >
            <input
              type="number"
              value={store.capacityKw || ''}
              onChange={(e) => store.setCapacityKw(Number(e.target.value))}
              className={styles.inputBare}
              style={{
                textAlign: 'right',
                width: '80px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'transparent',
                borderBottom: '1px dashed rgba(255,255,255,0.5)',
                padding: '0 2px',
              }}
            />
            <span className={styles.summaryUnit}>kW</span>
          </div>
        </div>
        <div
          style={{
            textAlign: 'right',
            borderLeft: '1px solid rgba(255,255,255,0.3)',
            paddingLeft: '1rem',
          }}
        >
          <div className={styles.summaryLabel}>모듈 수량</div>
          <div className={styles.summaryValue}>
            {panelCount.toLocaleString()}{' '}
            <span className={styles.summaryUnit}>ea</span>
          </div>
        </div>
      </div>
    </div>
  );
}
