# Source and adaptation

MODIFIED COPY: OMP-native adaptation of OMO's generated `computer-use` skill at
[10d8b1bc9193e1f7bc7a279b501d0102643801f7](https://github.com/code-yeongyu/oh-my-openagent/blob/10d8b1bc9193e1f7bc7a279b501d0102643801f7/packages/senpi-desktop-tool/src/skill.ts).
The generator also existed at the previous browser-port baseline
[42d5746e](https://github.com/code-yeongyu/oh-my-openagent/blob/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/senpi-desktop-tool/src/skill.ts).
Its applicable source terms are retained in [LICENSE.md](LICENSE.md).

The generated skill's availability, helper-reference, permission, target,
coordinate, accessibility, delivery and safety workflow is adapted to OMP.
The live reference body comes from OMP, rather than a second copied API manual:

- [OMP 18.19 computer guidance](https://github.com/can1357/oh-my-pi/blob/v18.19.0/packages/coding-agent/src/prompts/system/computer-use.md)
- [OMP 18.20 computer helper contract](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/coding-agent/src/prompts/tools/computer.md)
- [OMP 18.20 secure-input warning](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/coding-agent/src/prompts/tools/computer-secure-input.md)
- [Enabled computer prelude and host bridge](https://github.com/can1357/oh-my-pi/blob/v18.19.0/packages/coding-agent/src/tools/computer.ts)

The 18.20 secure-input and macOS/X11 intervention guidance is adapted under
[OMP's MIT license](https://github.com/can1357/oh-my-pi/blob/v18.20.0/LICENSE),
retained in [LICENSE.md](LICENSE.md). These source pins do not upgrade the host;
live native documentation and capabilities remain authoritative on 18.19.

OmO's engine, CUA adapter, tool-search registration, settings, permission API and
stop/resume commands are not installed or represented as OMP aliases. OMP owns
the enabled prelude, native tool documentation, OS permissions, foreground
confirmation and stop path. `/computer-use` loads this workflow; it does not
override OMP's `/computer` command or enable persistent settings.
