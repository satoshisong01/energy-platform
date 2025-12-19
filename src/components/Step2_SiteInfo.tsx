'use client';
import React, { useRef } from 'react'; // useRef 추가
import { useProposalStore } from '../lib/store';
import {
  LucidePlus,
  LucideTrash2,
  LucideUpload,
  LucideImage,
} from 'lucide-react';
import styles from '@/app/page.module.css';

export default function Step2_SiteInfo() {
  const store = useProposalStore();
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 인풋 참조

  // 640W 모듈 기준 수량 계산
  const panelCount =
    store.capacityKw > 0 ? Math.round((store.capacityKw * 1000) / 640) : 0;

  // [NEW] 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        store.setSiteImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className={styles.roofHeader}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
          <span className={styles.stepBadge}>2</span> 설치 공간 및 위성사진
        </h3>
        <button onClick={store.addRoofArea} className={styles.addButton}>
          <LucidePlus size={14} /> 추가
        </button>
      </div>

      {/* 기존 지붕 입력 루프 */}
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

      {/* [NEW] 위성사진 업로드 영역 */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <LucideImage size={16} /> 현장 위성사진 등록
          </span>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-bold"
          >
            <LucideUpload size={14} />{' '}
            {store.siteImage ? '사진 변경' : '사진 업로드'}
          </button>
        </div>

        {store.siteImage ? (
          <div className="relative w-full aspect-video bg-gray-200 rounded overflow-hidden border border-gray-300">
            <img
              src={store.siteImage}
              alt="위성사진"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            등록된 사진이 없습니다. (제안서 Page 2에 표시됩니다)
          </div>
        )}
      </div>

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
