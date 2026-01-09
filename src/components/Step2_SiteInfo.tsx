'use client';

import React, { useEffect, useRef } from 'react';
import { useProposalStore } from '../lib/store';
import {
  LucideMaximize,
  LucideSun,
  LucideUploadCloud,
  LucidePlus,
  LucideTrash2,
  LucideLayoutGrid,
  LucideArrowRightCircle, // 아이콘 추가
} from 'lucide-react';

export default function Step2_SiteInfo() {
  const store = useProposalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 총 면적 계산
  const totalAreaM2 = store.roofAreas.reduce(
    (acc, cur) => acc + (cur.valueM2 || 0),
    0
  );

  // 2. 평수 계산
  const totalAreaPyeong = totalAreaM2 / 3.3058;

  // 3. 최대 설치 가능 용량 (평수 / 2)
  const calculatedMaxCapacity = Math.floor(totalAreaPyeong / 2);

  // 4. 모듈 수량 계산
  const panelCount =
    store.capacityKw > 0 ? Math.round((store.capacityKw * 1000) / 640) : 0;

  // -----------------------------------------------------------------------
  // [수정 포인트] 자동 동기화 로직 삭제 (주석 처리)
  // 이유: 불러오기 시 저장된 값(예: 225kW)을 계산된 값(125kW)으로 덮어쓰는 문제 방지
  // -----------------------------------------------------------------------
  /*
  useEffect(() => {
    if (calculatedMaxCapacity > 0) {
      store.setCapacityKw(calculatedMaxCapacity);
    }
  }, [calculatedMaxCapacity]);
  */

  // [기능 추가] 최대 용량을 클릭하면 실제 용량에 적용하는 핸들러
  const applyMaxCapacity = () => {
    if (calculatedMaxCapacity > 0) {
      store.setCapacityKw(calculatedMaxCapacity);
    }
  };

  // 파일 업로드 핸들러
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
    <div className="w-full space-y-6">
      <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          Step 2
        </span>
        현장 정보 및 용량 설정
      </h3>

      {/* 1. 위성 사진 업로드 */}
      <div
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition bg-white cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />
        {store.siteImage ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 group">
            <img
              src={store.siteImage}
              alt="Site Preview"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold">
              이미지 변경하기
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <LucideUploadCloud size={24} />
            </div>
            <div className="text-sm font-bold text-slate-600">
              위성 지도 / 현장 사진 업로드
            </div>
            <div className="text-xs text-slate-400">
              클릭하여 이미지(JPG, PNG)를 선택하세요.
            </div>
          </div>
        )}
      </div>

      {/* 2. 설치 면적 입력 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
            <LucideMaximize size={16} className="text-blue-500" />
            설치 가능 지붕 면적 설정
          </label>
          <button
            onClick={store.addRoofArea}
            className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded transition font-bold"
          >
            <LucidePlus size={12} /> 구역 추가
          </button>
        </div>

        <div className="space-y-2">
          {store.roofAreas.map((area, index) => (
            <div key={area.id} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-4 text-center">
                {index + 1}
              </span>
              <input
                type="text"
                placeholder="구역명 (예: A동)"
                className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={area.name}
                onChange={(e) =>
                  store.updateRoofArea(area.id, 'name', e.target.value)
                }
              />
              <div className="relative w-32">
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={area.valueM2 || ''}
                  onChange={(e) =>
                    store.updateRoofArea(
                      area.id,
                      'valueM2',
                      Number(e.target.value)
                    )
                  }
                />
                <span className="absolute right-2 top-1.5 text-xs text-slate-400">
                  m²
                </span>
              </div>
              {store.roofAreas.length > 1 && (
                <button
                  onClick={() => store.removeRoofArea(area.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <LucideTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded">
          <div>
            총 면적:{' '}
            <span className="text-blue-600">
              {totalAreaM2.toLocaleString()}
            </span>{' '}
            m²
          </div>
          <div className="h-3 w-px bg-slate-300"></div>
          <div>
            약{' '}
            <span className="text-indigo-600">
              {Math.round(totalAreaPyeong).toLocaleString()}
            </span>{' '}
            평
          </div>
        </div>
      </div>

      {/* 3. 용량 설정 */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-200 pb-2">
          <LucideSun size={18} className="text-orange-500" />
          태양광 설비 용량 설정
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 왼쪽: 자동 계산된 최대값 (클릭하여 적용 가능하도록 변경) */}
          <div
            className="group cursor-pointer"
            onClick={applyMaxCapacity}
            title="클릭하여 설계값에 적용"
          >
            <label className="block text-xs font-bold text-slate-500 mb-1 group-hover:text-blue-600 transition-colors">
              최대 설치 가능 (평수 / 2)
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                className="w-full bg-slate-200 border border-slate-300 rounded-lg px-3 py-2 text-slate-500 font-bold focus:outline-none cursor-pointer text-right pr-10 group-hover:bg-blue-50 group-hover:border-blue-300 transition-colors"
                value={calculatedMaxCapacity.toLocaleString()}
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold pt-0.5 group-hover:text-blue-500">
                kW
              </span>
              {/* 클릭 유도 아이콘 */}
              <div className="absolute left-3 top-2.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <LucideArrowRightCircle size={16} />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 group-hover:text-blue-500">
              * 클릭 시 우측 '설계값'에 자동 적용됩니다.
            </div>
          </div>

          {/* 오른쪽: 실제 설계 용량 (수정 가능) */}
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1">
              실제 설비 용량 (설계값)
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full border border-blue-300 bg-white rounded-lg px-3 py-2 text-blue-800 font-extrabold focus:ring-2 focus:ring-blue-500 outline-none text-right pr-10 shadow-sm"
                placeholder="0"
                value={store.capacityKw || ''}
                onChange={(e) => store.setCapacityKw(Number(e.target.value))}
              />
              <span className="absolute right-3 top-2 text-xs text-blue-600 font-bold pt-0.5">
                kW
              </span>
            </div>
            <div className="flex justify-end items-center gap-1 text-[11px] text-blue-500 mt-1 font-bold">
              <LucideLayoutGrid size={12} />
              모듈 약 {panelCount.toLocaleString()}장 예상
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
