'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewComparisonTable.module.css';

export default function PreviewRequirementsTable() {
  const store = useProposalStore();
  const { config } = store;

  // [스타일 정의]
  const cellStyle = {
    padding: '16px 10px',
    verticalAlign: 'middle',
    fontSize: '0.85rem',
    lineHeight: '1.6',
  };

  const headerStyle = {
    ...cellStyle,
    padding: '12px 5px',
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center' as const,
    borderBottom: '2px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
  };

  const docCellStyle = {
    ...cellStyle,
    textAlign: 'left' as const,
    padding: '20px 15px',
    verticalAlign: 'top',
  };

  return (
    <div className={styles.container} style={{ marginTop: '2rem' }}>
      <div className={styles.titleWrapper} style={{ marginBottom: '1.5rem' }}>
        <h3 className={styles.title}>06. 사업 조건 및 구비 서류</h3>
      </div>

      <div className={styles.tableWrapper}>
        <table
          className={styles.compTable}
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              {/* [수정] 너비 10% -> 14%로 증가하여 줄바꿈 방지 */}
              <th style={{ ...headerStyle, width: '14%' }}>구분</th>

              {/* 나머지 열 너비 미세 조정 (총합 100% 유지) */}
              <th style={{ ...headerStyle, width: '14%' }}>
                자기자본
                <br />
                <span className={styles.subText}>(전액투자)</span>
              </th>
              <th style={{ ...headerStyle, width: '19%' }}>
                RPS 정책자금
                <br />
                <span className={styles.subText}>{config.loan_rate_rps}%</span>
              </th>
              <th style={{ ...headerStyle, width: '19%' }}>
                팩토링
                <br />
                <span className={styles.subText}>
                  {config.loan_rate_factoring}%
                </span>
              </th>
              <th style={{ ...headerStyle, width: '14%' }}>
                RE100연계
                <br />
                <span className={styles.subText}>임대형</span>
              </th>
              <th style={{ ...headerStyle, width: '20%', borderRight: 'none' }}>
                구독
                <br />
                <span className={styles.subText}>서비스</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 1. 조건 비교 행들 */}
            {[
              {
                label: '초기투자(자기자본)',
                vals: ['O(100%)', 'O(20%)', 'X', 'X', 'X'],
                highlight: true,
              },
              { label: '보증보험', vals: ['X', 'O(11%)', 'O(11%)', 'X', 'X'] },
              {
                label: '은행잔고증명',
                vals: ['X', 'O(15%)', 'O(15%)', 'X', 'X'],
              },
              { label: 'RE100(REC)', vals: ['O', 'O', 'O', 'O', 'O'] },
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 'bold',
                    backgroundColor: '#fdfdfd',
                    color: row.highlight ? '#dc2626' : '#475569',

                    // [수정] 중앙 정렬 및 단어 중간 줄바꿈 방지 적용
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                  }}
                >
                  {row.label}
                </td>
                {row.vals.map((val, i) => (
                  <td
                    key={i}
                    style={{
                      ...cellStyle,
                      textAlign: 'center',
                      color:
                        row.highlight && val.includes('O')
                          ? '#dc2626'
                          : '#334155',
                      fontWeight: row.highlight ? 'bold' : 'normal',
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}

            {/* 2. 구비서류 및 자격요건 */}
            <tr style={{ borderTop: '2px solid #cbd5e1' }}>
              <td
                style={{
                  ...cellStyle,
                  backgroundColor: '#f1f5f9',
                  fontWeight: 'bold',
                  textAlign: 'center', // 이미 적용되어 있음 (확인)
                }}
              >
                구비서류
                <br />
                (자격요건)
              </td>

              {/* 자기자본 */}
              <td style={{ ...cellStyle, textAlign: 'center' }}>-</td>

              {/* RPS */}
              <td style={docCellStyle}>
                <div
                  className={styles.textBlueBold}
                  style={{ marginBottom: '8px' }}
                >
                  주거래은행 사전 확인 필요
                </div>
                <ul
                  style={{
                    listStyleType: 'disc',
                    paddingLeft: '1.2rem',
                    margin: 0,
                  }}
                >
                  <li>사업자등록증 사본</li>
                  <li>자금추천 신청서</li>
                  <li>중소기업확인서</li>
                  <li>신재생에너지 보급량 산출근거</li>
                  <li>부지관련확인서류</li>
                  <li>계통연계 사전 확인서</li>
                  <li>공장등록증명서</li>
                </ul>
              </td>

              {/* 팩토링 */}
              <td style={docCellStyle}>
                <div
                  className={styles.textBlueBold}
                  style={{ marginBottom: '4px' }}
                >
                  사업가능 여부 확인 신용심사
                </div>
                <div
                  className={styles.textBlueBold}
                  style={{ marginBottom: '8px' }}
                >
                  서울보증의 지급보증 발급
                </div>
                <ul
                  style={{
                    listStyleType: 'disc',
                    paddingLeft: '1.2rem',
                    margin: 0,
                  }}
                >
                  <li>사업자등록증 사본</li>
                  <li>재무제표(최근3년)</li>
                  <li>대표이사 지방세 세목별 과세증명원</li>
                  <li>대표이사 개인정보동의(개인공인인증서)</li>
                </ul>
              </td>

              {/* 임대형 */}
              <td style={docCellStyle}>
                <div
                  className={styles.textBlueBold}
                  style={{ marginBottom: '8px' }}
                >
                  ㅇ 자기소유 전체 태양광의 20% - REC 확보
                </div>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  <li>ㅇ 80% 20,000원/kW</li>
                  <li>ㅇ 일시불 인센티브</li>
                </ul>
              </td>

              {/* 구독형 */}
              <td style={docCellStyle}>
                <ul
                  style={{
                    listStyleType: 'disc',
                    paddingLeft: '1.2rem',
                    margin: 0,
                  }}
                >
                  <li>신용등급 BB 이상</li>
                  <li>매출규모 상위</li>
                  <li>산업단지내 기업</li>
                  <li>사용요금 : 150원/kWh</li>
                  <li>발전용량 : 250kW이상</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
