import type { Component } from 'solid-js';
import { Match, Switch } from 'solid-js';
import type { SkipDayVisibility } from '../types/chore-types';
import { SkipDayVisibility as SkipDayVisibilityEnum } from '../types/chore-types';
import { InfoBox } from './info-box';

interface SkipDayVisibilityInfoProps {
  value: SkipDayVisibility;
}

export const SkipDayVisibilityInfo: Component<SkipDayVisibilityInfoProps> = (props) => (
  <InfoBox>
    <Switch>
      <Match when={props.value === SkipDayVisibilityEnum.HIDE}>
        <strong>Hide:</strong> The chore disappears completely on skip days. It's a true day off —
        no catch-up needed.
      </Match>
      <Match when={props.value === SkipDayVisibilityEnum.SHOW_ALWAYS}>
        <strong>Always Show:</strong> The chore stays visible on skip days. If it was completed on
        the previous valid day, it remains checked (a grace day). If it wasn't done, you can check
        it off on the skip day.
      </Match>
      <Match when={props.value === SkipDayVisibilityEnum.SHOW_IF_OVERDUE}>
        <strong>Show If Overdue:</strong> The chore appears on skip days only if it was missed on
        the previous valid day. You can check it off on the skip day to catch up.
      </Match>
    </Switch>
  </InfoBox>
);
