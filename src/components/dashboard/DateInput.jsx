'use client';

import { Calendar, DateField, DatePicker, Label } from '@heroui/react';
import { parseDate } from '@internationalized/date';

function toDateValue(iso) {
  if (!iso) return null;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}

// Pass `defaultValue` (uncontrolled, use with `name` + FormData)
// or `value` + `onChange` (controlled). Both use 'YYYY-MM-DD' strings.
export default function DateInput({ label, name, value, defaultValue, onChange, required = false }) {
  const stateProps =
    value !== undefined
      ? { value: toDateValue(value), onChange: (date) => onChange?.(date ? date.toString() : '') }
      : { defaultValue: toDateValue(defaultValue) };

  return (
    <DatePicker name={name} isRequired={required} className="w-full" {...stateProps}>
      <Label className="mb-1.5 block text-xs font-normal text-text-muted">{label}</Label>
      <DateField.Group fullWidth variant="secondary" className="h-10.5 rounded-xl border border-border bg-white">
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

      <DatePicker.Popover className="date-popover">
        <Calendar aria-label={label}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}