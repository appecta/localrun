import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useTerminalSize } from './hooks.js';

export default function FormView({ mode, initial, onSave, onCancel }) {
  const { cols } = useTerminalSize();
  const [name, setName] = useState(initial?.name ?? '');
  const [command, setCommand] = useState(initial?.command ?? '');
  const [stopCommand, setStopCommand] = useState(initial?.stopCommand ?? '');
  const [startAtLogin, setStartAtLogin] = useState(initial?.startAtLogin ?? false);
  const [focus, setFocus] = useState(0);
  // 0=name 1=command 2=stopCommand 3=startAtLogin 4=save

  const canSave = name.trim().length > 0 && command.trim().length > 0;
  const LAST = 4;

  useInput((input, key) => {
    if (key.escape) { onCancel(); return; }

    if (key.tab || key.downArrow) {
      setFocus(f => Math.min(LAST, f + 1));
      return;
    }
    if (key.upArrow) {
      setFocus(f => Math.max(0, f - 1));
      return;
    }

    // Enter in text fields advances to next
    if (focus >= 0 && focus <= 2 && key.return) {
      setFocus(f => f + 1);
      return;
    }

    if (focus === 3 && (input === ' ' || key.return)) {
      setStartAtLogin(v => !v);
      return;
    }

    if (focus === 4 && key.return && canSave) {
      onSave({
        name: name.trim(),
        command: command.trim(),
        stopCommand: stopCommand.trim(),
        startAtLogin,
      });
    }
  });

  const labelColor = (f) => focus === f ? 'cyan' : 'gray';

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color="cyan">{mode === 'add' ? 'Add Server' : 'Edit Server'}</Text>
      <Text dimColor>{'─'.repeat(Math.max(10, cols - 8))}</Text>

      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color={labelColor(0)}>{'Name         '}</Text>
          <TextInput
            value={name}
            onChange={setName}
            focus={focus === 0}
            placeholder="e.g. my-blog"
          />
        </Box>

        <Box marginBottom={1}>
          <Text color={labelColor(1)}>{'Start        '}</Text>
          <TextInput
            value={command}
            onChange={setCommand}
            focus={focus === 1}
            placeholder="e.g. npm run dev"
          />
        </Box>

        <Box marginBottom={1}>
          <Text color={labelColor(2)}>{'Stop         '}</Text>
          <TextInput
            value={stopCommand}
            onChange={setStopCommand}
            focus={focus === 2}
            placeholder="optional — leave blank to use SIGTERM"
          />
        </Box>

        <Box marginBottom={1} alignItems="center">
          <Text color={labelColor(3)}>{'Start at login  '}</Text>
          <Text
            bold={focus === 3}
            inverse={focus === 3}
            color={startAtLogin ? 'green' : 'gray'}
          >
            {startAtLogin ? ' Yes ' : ' No  '}
          </Text>
          <Text dimColor>  space to toggle</Text>
        </Box>

        <Box marginTop={1}>
          <Text
            bold
            inverse={focus === 4}
            color={!canSave ? 'gray' : focus === 4 ? 'white' : 'green'}
          >
            {' Save '}
          </Text>
          {!canSave && <Text dimColor>  name and start command required</Text>}
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text dimColor>Tab / ↑↓ navigate   Esc cancel</Text>
      </Box>
    </Box>
  );
}
