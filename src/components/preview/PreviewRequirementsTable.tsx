'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewComparisonTable.module.css'; // 스타일은 비교 테이블과 공유

export default function PreviewRequirementsTable() {
  const store = useProposalStore();
  const { config, isEcSelfConsumption } = store;

  // [NEW] 자가소비(고정형) 모드면 임대/구독 숨김
  const showRentSub = !isEcSelfConsumption;

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

  // [NEW] 컬럼 너비 동적 계산
  // 숨겨질 때는 4개 컬럼(구분+3개)이므로 각각 25%
  // 보여질 때는 기존 비율 유지
  const widthLabel = showRentSub ? '14%' : '25%';
  const widthSelf = showRentSub ? '14%' : '25%';
  const widthRps = showRentSub ? '19%' : '25%';
  const widthFac = showRentSub ? '19%' : '25%';
  // 팩토링이 마지막일 경우 우측 테두리 제거
  const borderRightFac = showRentSub ? '1px solid #e2e8f0' : 'none';

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
              <th style={{ ...headerStyle, width: widthLabel }}>구분</th>

              <th style={{ ...headerStyle, width: widthSelf }}>
                자기자본
                <br />
                <span className={styles.subText}>(전액투자)</span>
              </th>
              <th style={{ ...headerStyle, width: widthRps }}>
                RPS 정책자금
                <br />
                <span className={styles.subText}>{config.loan_rate_rps}%</span>
              </th>
              <th
                style={{
                  ...headerStyle,
                  width: widthFac,
                  borderRight: borderRightFac,
                }}
              >
                팩토링
                <br />
                <span className={styles.subText}>
                  {config.loan_rate_factoring}%
                </span>
              </th>

              {/* 조건부 렌더링 */}
              {showRentSub && (
                <>
                  <th style={{ ...headerStyle, width: '14%' }}>
                    RE100연계
                    <br />
                    <span className={styles.subText}>임대형</span>
                  </th>
                  <th
                    style={{
                      ...headerStyle,
                      width: '20%',
                      borderRight: 'none',
                    }}
                  >
                    구독
                    <br />
                    <span className={styles.subText}>서비스</span>
                  </th>
                </>
              )}
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
            ].map((row, idx) => {
              // 숨김 모드일 때는 앞의 3개 데이터만 사용
              const displayVals = showRentSub ? row.vals : row.vals.slice(0, 3);

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 'bold',
                      backgroundColor: '#fdfdfd',
                      color: row.highlight ? '#dc2626' : '#475569',
                      textAlign: 'center',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {row.label}
                  </td>
                  {displayVals.map((val, i) => (
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
                        // 마지막 컬럼이면 보더 제거
                        borderRight:
                          !showRentSub && i === 2 ? 'none' : undefined,
                      }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* 2. 구비서류 및 자격요건 */}
            <tr style={{ borderTop: '2px solid #cbd5e1' }}>
              <td
                style={{
                  ...cellStyle,
                  backgroundColor: '#f1f5f9',
                  fontWeight: 'bold',
                  textAlign: 'center',
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
              <td style={{ ...docCellStyle, borderRight: borderRightFac }}>
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

              {/* 임대형 & 구독형 (조건부) */}
              {showRentSub && (
                <>
                  <td style={docCellStyle}>
                    <div
                      className={styles.textBlueBold}
                      style={{ marginBottom: '8px' }}
                    >
                      ㅇ 자기소유 전체 태양광의 20% - REC 확보
                    </div>
                    <ul
                      style={{
                        listStyleType: 'none',
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      <li>ㅇ 80% 20,000원/kW</li>
                      <li>ㅇ 일시불 인센티브 지급가능</li>
                    </ul>
                  </td>

                  <td style={{ ...docCellStyle, borderRight: 'none' }}>
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
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
