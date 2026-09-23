'use client';

import { useId } from "react";
import { Switch } from "@heroui/react";
import { Check, X } from "lucide-react";

export default function IOSSwitch({ checked, onChange, label, description }) {
  const switchId = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      
      {/* 1. Clickable Text Area (Controls the switch natively via htmlFor) */}
      <label 
        htmlFor={switchId}
        className="min-w-0 flex-1 cursor-pointer"
      >
        <span className="block text-sm font-medium text-text">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-text-muted">{description}</span>
        )}
      </label>

      {/* 2. The Switch Button */}
      <Switch
        id={switchId}
        isSelected={checked}
        onChange={onChange} // FIX: HeroUI uses onChange, not onValueChange
        aria-label={label}
        size="lg"
      >
        {/* Restored HeroUI compound components so the switch track physically renders */}
        {({ isSelected }) => (
          <Switch.Content>
            <Switch.Control className={isSelected ? "bg-green-500" : ""}>
              <Switch.Thumb>
                <Switch.Icon>
                  {isSelected ? (
                    <Check className="size-3 text-gray-500" />
                  ) : (
                    <X className="size-3 text-gray-500" />
                  )}
                </Switch.Icon>
              </Switch.Thumb>
            </Switch.Control>
          </Switch.Content>
        )}
      </Switch>
      
    </div>
  );
}