import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTerminalSize } from './hooks.js';

export default function WelcomeView({ onDone, zshrcAdded, onToggleZshrc }) {
  const [toggling, setToggling] = useState(false);
  const { cols } = useTerminalSize();
  const sep = '─'.repeat(Math.max(10, cols - 8));

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (!toggling) { onDone(); return; }
    }
    if (input === 'z') {
      onToggleZshrc();
    }
    if (key.escape) {
      onDone();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">LocalRun</Text>
        <Text dimColor>  localhost server manager</Text>
      </Box>
      <Text dimColor>{sep}</Text>

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        <Text>Manage all your localhost dev servers from one place.</Text>
        <Text>No more remembering paths and commands.</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="green">  ● </Text>
          <Text>Add servers with their start and stop commands</Text>
        </Box>
        <Box>
          <Text color="green">  ● </Text>
          <Text>Start / stop with </Text>
          <Text bold>Enter</Text>
          <Text> or </Text>
          <Text bold>Space</Text>
        </Box>
        <Box>
          <Text color="green">  ● </Text>
          <Text>Port and IP shown when running — easy copy-paste</Text>
        </Box>
        <Box>
          <Text color="green">  ● </Text>
          <Text>Optional: start a server automatically at macOS login</Text>
        </Box>
      </Box>

      <Text dimColor>{sep}</Text>

      <Box marginTop={1} marginBottom={1} flexDirection="column">
        <Box>
          <Text>Add </Text>
          <Text bold color="cyan">localrun</Text>
          <Text> alias to ~/.zshrc   </Text>
          <Text
            bold
            inverse
            color={zshrcAdded ? 'green' : 'gray'}
          >
            {zshrcAdded ? ' Yes ' : ' No  '}
          </Text>
          <Text dimColor>  press </Text>
          <Text bold>z</Text>
          <Text dimColor> to toggle</Text>
        </Box>
        {zshrcAdded && (
          <Box marginTop={0} paddingLeft={2}>
            <Text dimColor>Type </Text>
            <Text color="cyan">localrun</Text>
            <Text dimColor> in any new terminal to open this app.</Text>
          </Box>
        )}
      </Box>

      <Text dimColor>{sep}</Text>

      <Box marginTop={1}>
        <Text dimColor>Press </Text>
        <Text bold>Enter</Text>
        <Text dimColor> or </Text>
        <Text bold>Space</Text>
        <Text dimColor> to get started</Text>
      </Box>
    </Box>
  );
}
