'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSiteAnalysis.module.css';
import { LucideArrowDown } from 'lucide-react';

export default function PreviewSiteAnalysis() {
  const store = useProposalStore();
  const { roofAreas, capacityKw, address, siteImage, config } = store;

  // 1. 전체 면적 m² 계산
  const totalAreaM2 = roofAreas.reduce(
    (acc, cur) => acc + (cur.valueM2 || 0),
    0,
  );

  // 2. 평수 계산 (단순 표시용)
  const totalAreaPyeong = totalAreaM2 / 3.3058;

  // 3. 모듈 수량 (설정값 사용, 기본값 645W)
  const panelWatt = config.solar_panel_wattage || 645;
  const moduleCount =
    capacityKw > 0 ? Math.round((capacityKw * 1000) / panelWatt) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.headerTitle}>
        02. RE100 에너지 발전 설치 공간 분석
      </div>

      <div className={styles.contentGrid}>
        {/* [왼쪽] 공장 지붕 분석 */}
        <div className={styles.leftPanel}>
          <div className={styles.subHeader}>공장 지붕</div>

          <div className={styles.areaInfoBox}>
            <span className={styles.label}>공장 지붕 면적</span>
            <span className={styles.valMain}>
              {Math.round(totalAreaPyeong).toLocaleString()} 평
            </span>
            <span className={styles.valSub}>
              ({totalAreaM2.toLocaleString()} m²)
            </span>
          </div>

          <div className={styles.imageBox}>
            {siteImage ? (
              <img
                src={siteImage}
                alt="현장 위성사진"
                className={styles.siteImage}
              />
            ) : (
              <div className={styles.noImage}>
                위성사진이 등록되지 않았습니다.
                <br />
                (입력 패널 Step 2에서 등록해주세요)
              </div>
            )}
          </div>

          <div className={styles.addressText}>
            &lt; {address || '주소 미입력'} &gt;
          </div>
        </div>

        {/* [오른쪽] 태양광 설치 가능 공간 */}
        <div className={styles.rightPanel}>
          <div className={styles.subHeader}>태양광설치 가능 공간</div>

          <div className={styles.capacityRow}>
            <span>최대가능발전</span>
            <span className={styles.capacityVal}>
              {capacityKw.toLocaleString()} kW
            </span>
          </div>

          <div className={styles.arrowContainer}>
            <LucideArrowDown
              size={32}
              className="text-slate-400"
              strokeWidth={3}
            />
          </div>

          {/* 최적 설치 공간 (Step 2에서 결정된 용량 표시) */}
          <div className={styles.optimalBox}>
            <div className={styles.optLabel}>최적 설치 공간</div>
            <div className={styles.optVal}>
              {capacityKw.toLocaleString()} kW
            </div>
          </div>

          {/* 한전 최대 발전 */}
          <div className={styles.kepcoBox}>
            <div className={styles.kepLabel}>한전최대발전</div>
            <div className={styles.kepVal}>
              {capacityKw.toLocaleString()} kW
            </div>
          </div>

          {/* 모듈 정보 (설정된 Watt 반영) */}
          <div className={styles.moduleInfo}>
            <div className={styles.moduleRow}>
              <span className="font-bold text-slate-600">모듈 출력</span>
              <span>{panelWatt} W</span>
            </div>
            <div className={styles.moduleRow}>
              <span className="font-bold text-slate-600">설치 수량</span>
              <span>{moduleCount.toLocaleString()} ea</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
