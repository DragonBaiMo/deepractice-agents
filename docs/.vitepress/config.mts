import { defineConfig } from 'vitepress'

export default defineConfig({
  srcExclude: [
    '**/chapter04/4.2-*.md',
    '**/chapter04/4.3-*.md',
    '**/chapter04/4.4-*.md'
  ],
  title: 'Deepractice 智能体教程',
  description: 'AI Agent 开发教程 - 基于 TypeScript + AgentX + PromptX',
  lang: 'zh-CN',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '开始学习', link: '/前言' },
      { text: 'GitHub', link: 'https://github.com/deepractice/deepractice-agents' }
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '前言', link: '/前言' }
        ]
      },
      {
        text: '第一章：智能体入门',
        collapsed: false,
        items: [
          { text: '章节概述', link: '/chapter01/' },
          { text: '1.1 什么是智能体', link: '/chapter01/1.1-什么是智能体' },
          { text: '1.2 智能体如何工作', link: '/chapter01/1.2-智能体如何工作' },
          { text: '1.3 构建第一个智能体', link: '/chapter01/1.3-构建第一个智能体' },
          { text: '1.4 智能体应用生态', link: '/chapter01/1.4-智能体应用生态' },
          { text: '1.5 习题与讨论', link: '/chapter01/1.5-习题与讨论' }
        ]
      },
      {
        text: '第二章：智能体发展简史',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter02/' },
          { text: '2.1 符号主义时代', link: '/chapter02/2.1-符号主义时代' },
          { text: '2.2 构建规则聊天机器人', link: '/chapter02/2.2-构建规则聊天机器人' },
          { text: '2.3 心智社会理论', link: '/chapter02/2.3-心智社会理论' },
          { text: '2.4 学习范式演进', link: '/chapter02/2.4-学习范式演进' },
          { text: '2.5 智能体爆发时代', link: '/chapter02/2.5-智能体爆发时代' },
          { text: '2.6 习题与讨论', link: '/chapter02/2.6-习题与讨论' }
        ]
      },
      {
        text: '第三章：大语言模型基础',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter03/' },
          { text: '3.1 语言模型简史', link: '/chapter03/3.1-语言模型简史' },
          { text: '3.2 Prompt工程基础', link: '/chapter03/3.2-Prompt工程基础' },
          { text: '3.3 LLM的能力与边界', link: '/chapter03/3.3-LLM的能力与边界' },
          { text: '3.4 从LLM到智能体架构', link: '/chapter03/3.4-从LLM到智能体架构' }
        ]
      },
      {
        text: '第四章：智能体设计范式',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter04/' },
          { text: '4.1 环境准备与基础工具', link: '/chapter04/4.1-环境准备与基础工具' },
          { text: '4.2 ReAct范式', link: '/chapter04/4.2-ReAct范式' },
          { text: '4.3 Plan-and-Solve范式', link: '/chapter04/4.3-Plan-and-Solve范式' },
          { text: '4.4 Reflection范式', link: '/chapter04/4.4-Reflection范式' },
          { text: '4.5 从手写到框架', link: '/chapter04/4.5-从手写到框架' },
          { text: '4.6 本章小结', link: '/chapter04/4.6-本章小结' }
        ]
      },
      {
        text: '第五章：PromptX 系统',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter05/' },
          { text: '5.1 五分钟体验PromptX', link: '/chapter05/5.1-五分钟体验PromptX' },
          { text: '5.2 语义鸿沟', link: '/chapter05/5.2-语义鸿沟' },
          { text: '5.3 Nuwa角色创建', link: '/chapter05/5.3-Nuwa角色创建' },
          { text: '5.4 Luban工具创建', link: '/chapter05/5.4-Luban工具创建' },
          { text: '5.5 Engram记忆网络', link: '/chapter05/5.5-Engram记忆网络' },
          { text: '5.6 本章小结', link: '/chapter05/5.6-本章小结' }
        ]
      },
      {
        text: '第六章：多智能体协作',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter06/' },
          { text: '6.1 从单智能体到多智能体', link: '/chapter06/6.1-从单智能体到多智能体' },
          { text: '6.2 4P理论', link: '/chapter06/6.2-4P理论' },
          { text: '6.3 AI任务状态机', link: '/chapter06/6.3-AI任务状态机' },
          { text: '6.4 PATEOAS', link: '/chapter06/6.4-PATEOAS' },
          { text: '6.5 AI组织化', link: '/chapter06/6.5-AI组织化' },
          { text: '6.6 本章小结', link: '/chapter06/6.6-本章小结' }
        ]
      },
      {
        text: '第七章：AgentX 框架',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter07/' },
          { text: '7.1 AgentX简介与设计哲学', link: '/chapter07/7.1-AgentX简介与设计哲学' },
          { text: '7.2 快速开始', link: '/chapter07/7.2-快速开始' },
          { text: '7.3 核心概念', link: '/chapter07/7.3-核心概念' },
          { text: '7.4 运行时系统', link: '/chapter07/7.4-运行时系统' },
          { text: '7.5 与PromptX集成', link: '/chapter07/7.5-与PromptX集成' },
          { text: '7.6 本章小结', link: '/chapter07/7.6-本章小结' }
        ]
      },
      {
        text: '第八章：主流框架对比',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter08/' }
        ]
      },
      {
        text: '第九章：Monogent 认知架构',
        collapsed: true,
        items: [
          { text: '章节概述', link: '/chapter09/' },
          { text: '9.1 Monogent架构深入', link: '/chapter09/9.1-Monogent架构深入' },
          { text: '9.2 Experience与Evolution实战', link: '/chapter09/9.2-Experience与Evolution实战' },
          { text: '9.3 七阶段管道实现', link: '/chapter09/9.3-七阶段管道实现' },
          { text: '9.4 双基质策略设计', link: '/chapter09/9.4-双基质策略设计' },
          { text: '9.5 与AgentX-PromptX集成', link: '/chapter09/9.5-与AgentX-PromptX集成' },
          { text: '9.6 本章小结', link: '/chapter09/9.6-本章小结' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/deepractice/deepractice-agents' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Deepractice'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    }
  }
})
