'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** 값이 0이면 빈 칸으로 표시(placeholder 노출). 면적/용량처럼 0=미입력인 칸에 사용. */
  blankZero?: boolean;
}

/**
 * 천 단위 콤마 표시 숫자 입력.
 * - 평소: 콤마 포맷(8,320). 포커스 시: 편집용 raw 숫자.
 * - onChange 시 콤마 제거 후 숫자로 파싱해 number 로 콜백 → 저장값/계산은 불변(표시 전용).
 * - 소수점 입력 허용(EC 대수 등). Step3의 기존 NumberInput과 동일 패턴.
 */
export default function CommaNumberInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
  blankZero,
}: Props) {
  const [tempValue, setTempValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      const isBlank = value === undefined || value === null;
      setTempValue(
        isBlank || (blankZero && value === 0)
          ? ''
          : value.toLocaleString(undefined, { maximumFractionDigits: 6 })
      );
    }
  }, [value, isFocused, blankZero]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      value={tempValue}
      onFocus={() => {
        setIsFocused(true);
        const showRaw =
          value !== undefined &&
          value !== null &&
          !(blankZero && value === 0);
        setTempValue(showRaw ? String(value) : '');
      }}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '') {
          setTempValue('');
          onChange(0);
          return;
        }
        if (/^-?\d*\.?\d*$/.test(raw)) {
          setTempValue(raw);
          const num = parseFloat(raw);
          if (!isNaN(num)) onChange(num);
        }
      }}
    />
  );
}
