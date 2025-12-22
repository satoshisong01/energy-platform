'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
// 기존 스타일 파일 재사용 (경로 확인 필요)
import styles from './PreviewComparisonTable.module.css';

export default function PreviewRequirementsTable() {
  const store = useProposalStore();
  const { config } = store;

  return (
    <div className={styles.container}>
      <div className={styles.titleWrapper}>
        <h3 className={styles.title}>6. 사업 조건 및 구비 서류</h3>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.compTable}>
          <thead>
            <tr>
              <th className={styles.colLabel}>구분</th>
              <th className={styles.colSelf}>
                자기자본
                <br />
                <span className={styles.subText}>(전액투자)</span>
              </th>
              <th className={styles.colRps}>
                RPS 정책자금
                <br />
                <span className={styles.subText}>{config.loan_rate_rps}%</span>
              </th>
              <th className={styles.colFac}>
                팩토링
                <br />
                <span className={styles.subText}>
                  {config.loan_rate_factoring}%
                </span>
              </th>
              <th className={styles.colRental}>
                임대형
                <br />
                <span className={styles.subText}>부지임대</span>
              </th>
              <th className={styles.colSub}>
                구독형
                <br />
                <span className={styles.subText}>서비스</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 1. 조건 비교 (이미지 image_2d45c7.png, image_2d3ac9.png 참조) */}
            <tr>
              <td className={styles.rowHeader} style={{ color: '#dc2626' }}>
                초기투자(자기자본)
              </td>
              <td
                className={styles.val}
                style={{ color: '#dc2626', fontWeight: 'bold' }}
              >
                O(100%)
              </td>
              <td
                className={styles.val}
                style={{ color: '#dc2626', fontWeight: 'bold' }}
              >
                O(20%)
              </td>
              <td
                className={styles.val}
                style={{ color: '#dc2626', fontWeight: 'bold' }}
              >
                X
              </td>
              <td
                className={styles.val}
                style={{ color: '#dc2626', fontWeight: 'bold' }}
              >
                X
              </td>
              <td
                className={styles.val}
                style={{ color: '#dc2626', fontWeight: 'bold' }}
              >
                X
              </td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>보증보험</td>
              <td className={styles.val}>X</td>
              <td className={styles.val}>O(11%)</td>
              <td className={styles.val}>O(11%)</td>
              <td className={styles.val}>X</td>
              <td className={styles.val}>X</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>은행잔고증명</td>
              <td className={styles.val}>X</td>
              <td className={styles.val}>O(15%)</td>
              <td className={styles.val}>O(15%)</td>
              <td className={styles.val}>X</td>
              <td className={styles.val}>X</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>RE100(REC)</td>
              <td className={styles.val}>O</td>
              <td className={styles.val}>O</td>
              <td className={styles.val}>O</td>
              <td className={styles.val}>O</td>
              <td className={styles.val}>O</td>
            </tr>

            {/* 2. 구비서류 및 자격요건 (이미지 내용 반영) */}
            <tr style={{ borderTop: '2px solid #cbd5e1' }}>
              <td
                className={styles.rowHeader}
                style={{
                  verticalAlign: 'middle',
                  backgroundColor: '#f8fafc',
                  height: '150px',
                }}
              >
                구비서류
                <br />
                (자격요건)
              </td>

              {/* 자기자본 */}
              <td className={styles.val}>-</td>

              {/* RPS */}
              <td className={styles.docCell}>
                <div className={styles.textBlueBold}>
                  주거래은행 사전 확인 필요
                </div>
                <div>사업자등록증 사본</div>
                <div>자금추천 신청서</div>
                <div>중소기업확인서</div>
                <div>신재생에너지 보급량 산출근거</div>
                <div>부지관련확인서류</div>
                <div>계통연계 사전 확인서</div>
                <div>공장등록증명서</div>
              </td>

              {/* 팩토링 */}
              <td className={styles.docCell}>
                <div className={styles.textBlueBold}>
                  사업가능 여부 확인 신용심사
                </div>
                <div className={styles.textBlueBold}>
                  서울보증의 지급보증 발급
                </div>
                <div>사업자등록증 사본</div>
                <div>재무제표(최근3년)</div>
                <div>대표이사 지방세 세목별 과세증명원</div>
                <div>대표이사 개인정보동의(개인공인인증서)</div>
              </td>

              {/* 임대형 */}
              <td className={styles.docCell}>
                <div className={styles.textBlueBold}>
                  ㅇ 자기소유 전체 태양광의 20% - REC 확보
                </div>
                <div>ㅇ 80% 20,000원/kW</div>
                <div>ㅇ 일시불 인센티브</div>
              </td>

              {/* 구독형 */}
              <td className={styles.docCell}>
                <div>· 신용등급 BB 이상</div>
                <div>· 매출규모 상위</div>
                <div>· 산업단지내 기업</div>
                <div>· 사용요금 : 150원/kWh</div>
                <div>· 발전용량 : 250kW이상</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
