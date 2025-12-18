'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useProposalStore, ProposalMeta } from '../lib/store';
import {
  LucideX,
  LucideFileText,
  LucideTrash2,
  LucideLoader,
  LucidePen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProposalListModal({ isOpen, onClose }: Props) {
  // 필요한 함수들만 선택
  const fetchProposalList = useProposalStore(
    (state) => state.fetchProposalList
  );
  const loadProposal = useProposalStore((state) => state.loadProposal);
  const deleteProposal = useProposalStore((state) => state.deleteProposal);
  const renameProposal = useProposalStore((state) => state.renameProposal);

  const [list, setList] = useState<ProposalMeta[]>([]);
  const [loading, setLoading] = useState(false);

  // 목록 불러오기 함수
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProposalList();
      setList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchProposalList]);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen, loadList]);

  // 불러오기 (본문 클릭)
  const handleLoad = async (id: number) => {
    if (
      confirm('이 견적서를 불러오시겠습니까? \n(작성 중인 내용은 사라집니다)')
    ) {
      await loadProposal(id);
      onClose();
    }
  };

  // 삭제 (휴지통 아이콘 클릭)
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (
      confirm('정말 삭제하시겠습니까? \n삭제된 데이터는 복구할 수 없습니다.')
    ) {
      await deleteProposal(id);
      loadList(); // 목록 갱신
    }
  };

  // [NEW] 이름 변경 (연필 아이콘 클릭)
  const handleRename = async (e: React.MouseEvent, item: ProposalMeta) => {
    e.stopPropagation();
    const newName = prompt(
      '변경할 견적서 이름을 입력하세요:',
      item.proposal_name
    );

    // 이름이 있고, 내용이 바뀌었을 때만 요청
    if (newName && newName.trim() !== '' && newName !== item.proposal_name) {
      const success = await renameProposal(item.id, newName.trim());
      if (success) {
        loadList(); // 성공 시 목록 갱신
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(
      2,
      '0'
    )}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '550px',
          maxWidth: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#1e293b',
            }}
          >
            📂 분석자료 불러오기
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LucideX size={24} color="#64748b" />
          </button>
        </div>

        {/* 목록 영역 */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#f8fafc',
          }}
        >
          {loading ? (
            <div
              style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}
            >
              <LucideLoader
                className="animate-spin"
                style={{ display: 'inline-block', marginBottom: '10px' }}
              />
              <p>목록을 불러오는 중...</p>
            </div>
          ) : list.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}
            >
              <p>저장된 견적서가 없습니다.</p>
            </div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {list.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoad(item.id)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = '#3b82f6')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = '#e2e8f0')
                  }
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <LucideFileText size={16} color="#3b82f6" />
                      {item.proposal_name || item.client_name || '제목 없음'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      고객명: {item.client_name} <br />
                      수정일: {formatDate(item.updated_at || item.created_at)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* [NEW] 수정 버튼 */}
                    <button
                      onClick={(e) => handleRename(e, item)}
                      style={{
                        padding: '8px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      title="이름 변경"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#e2e8f0')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = '#f1f5f9')
                      }
                    >
                      <LucidePen size={18} />
                    </button>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      style={{
                        padding: '8px',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      title="삭제"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#fecaca')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = '#fee2e2')
                      }
                    >
                      <LucideTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
