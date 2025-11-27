import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { InferenceClient } from '@huggingface/inference'

// Optional: 서버 설정 스키마 (API 키 등 사용자 설정이 필요한 경우)
export const configSchema = z.object({
    hfToken: z.string().optional().describe('Hugging Face API Token (이미지 생성 기능에 필요)')
})

// 가짜 서버 정보 데이터
const fakeServers = [
    {
        id: 'server-001',
        name: 'Web Server Alpha',
        ip: '192.168.1.101',
        status: 'running',
        cpu: '45%',
        memory: '62%',
        uptime: '15일 3시간 22분',
        os: 'Ubuntu 22.04 LTS'
    },
    {
        id: 'server-002',
        name: 'Database Server Beta',
        ip: '192.168.1.102',
        status: 'running',
        cpu: '78%',
        memory: '85%',
        uptime: '30일 12시간 45분',
        os: 'CentOS 8'
    },
    {
        id: 'server-003',
        name: 'API Gateway Gamma',
        ip: '192.168.1.103',
        status: 'maintenance',
        cpu: '12%',
        memory: '34%',
        uptime: '2일 8시간 15분',
        os: 'Debian 11'
    },
    {
        id: 'server-004',
        name: 'Cache Server Delta',
        ip: '192.168.1.104',
        status: 'stopped',
        cpu: '0%',
        memory: '0%',
        uptime: '0일 0시간 0분',
        os: 'Alpine Linux 3.18'
    }
]

// 언어별 인사말 매핑
const greetings: Record<string, (name: string) => string> = {
    korean: (name) => `안녕하세요, ${name}님! 반갑습니다!`,
    english: (name) => `Hello, ${name}! Nice to meet you!`,
    japanese: (name) => `こんにちは、${name}さん！はじめまして！`,
    chinese: (name) => `你好，${name}！很高兴认识你！`,
    spanish: (name) => `¡Hola, ${name}! ¡Encantado de conocerte!`,
    french: (name) => `Bonjour, ${name}! Enchanté de vous rencontrer!`,
    german: (name) => `Hallo, ${name}! Freut mich, Sie kennenzulernen!`,
}

// 지역별 타임존 매핑
const timezones: Record<string, string> = {
    // 아시아
    'seoul': 'Asia/Seoul',
    'korea': 'Asia/Seoul',
    '서울': 'Asia/Seoul',
    '한국': 'Asia/Seoul',
    'tokyo': 'Asia/Tokyo',
    'japan': 'Asia/Tokyo',
    '도쿄': 'Asia/Tokyo',
    '일본': 'Asia/Tokyo',
    'beijing': 'Asia/Shanghai',
    'china': 'Asia/Shanghai',
    '베이징': 'Asia/Shanghai',
    '중국': 'Asia/Shanghai',
    'shanghai': 'Asia/Shanghai',
    '상하이': 'Asia/Shanghai',
    'hong_kong': 'Asia/Hong_Kong',
    '홍콩': 'Asia/Hong_Kong',
    'singapore': 'Asia/Singapore',
    '싱가포르': 'Asia/Singapore',
    'bangkok': 'Asia/Bangkok',
    '방콕': 'Asia/Bangkok',
    'dubai': 'Asia/Dubai',
    '두바이': 'Asia/Dubai',
    'india': 'Asia/Kolkata',
    '인도': 'Asia/Kolkata',
    'mumbai': 'Asia/Kolkata',
    '뭄바이': 'Asia/Kolkata',
    
    // 유럽
    'london': 'Europe/London',
    '런던': 'Europe/London',
    'uk': 'Europe/London',
    '영국': 'Europe/London',
    'paris': 'Europe/Paris',
    '파리': 'Europe/Paris',
    'france': 'Europe/Paris',
    '프랑스': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    '베를린': 'Europe/Berlin',
    'germany': 'Europe/Berlin',
    '독일': 'Europe/Berlin',
    'rome': 'Europe/Rome',
    '로마': 'Europe/Rome',
    'italy': 'Europe/Rome',
    '이탈리아': 'Europe/Rome',
    'madrid': 'Europe/Madrid',
    '마드리드': 'Europe/Madrid',
    'spain': 'Europe/Madrid',
    '스페인': 'Europe/Madrid',
    'moscow': 'Europe/Moscow',
    '모스크바': 'Europe/Moscow',
    'russia': 'Europe/Moscow',
    '러시아': 'Europe/Moscow',
    
    // 아메리카
    'new_york': 'America/New_York',
    'newyork': 'America/New_York',
    '뉴욕': 'America/New_York',
    'los_angeles': 'America/Los_Angeles',
    'la': 'America/Los_Angeles',
    '로스앤젤레스': 'America/Los_Angeles',
    'chicago': 'America/Chicago',
    '시카고': 'America/Chicago',
    'toronto': 'America/Toronto',
    '토론토': 'America/Toronto',
    'canada': 'America/Toronto',
    '캐나다': 'America/Toronto',
    'mexico': 'America/Mexico_City',
    '멕시코': 'America/Mexico_City',
    'sao_paulo': 'America/Sao_Paulo',
    '상파울루': 'America/Sao_Paulo',
    'brazil': 'America/Sao_Paulo',
    '브라질': 'America/Sao_Paulo',
    
    // 오세아니아
    'sydney': 'Australia/Sydney',
    '시드니': 'Australia/Sydney',
    'australia': 'Australia/Sydney',
    '호주': 'Australia/Sydney',
    'melbourne': 'Australia/Melbourne',
    '멜버른': 'Australia/Melbourne',
    'auckland': 'Pacific/Auckland',
    '오클랜드': 'Pacific/Auckland',
    'new_zealand': 'Pacific/Auckland',
    '뉴질랜드': 'Pacific/Auckland',
}

// Required: Smithery에서 요구하는 createServer 함수를 default export
export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
    // Create server instance
    const server = new McpServer({
        name: 'my-mcp-server',
        version: '1.0.0'
    })

    // code_review 프롬프트 등록
    server.prompt(
        'code_review',
        '사용자로부터 코드를 받아 코드 리뷰를 수행합니다.',
        {
            code: z.string().describe('리뷰할 코드'),
            language: z.string().optional().describe('프로그래밍 언어 (선택사항)')
        },
        async ({ code, language }) => {
            const langInfo = language ? `\n프로그래밍 언어: ${language}` : ''
            
            return {
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text: `다음 코드에 대해 상세한 코드 리뷰를 수행해주세요.${langInfo}

## 리뷰 항목
1. **코드 품질**: 가독성, 명명 규칙, 코드 구조
2. **버그 및 오류**: 잠재적인 버그나 논리적 오류
3. **성능**: 성능 개선이 필요한 부분
4. **보안**: 보안 취약점이 있는지 확인
5. **베스트 프랙티스**: 해당 언어/프레임워크의 모범 사례 준수 여부
6. **개선 제안**: 구체적인 개선 방안

## 리뷰할 코드
\`\`\`${language || ''}
${code}
\`\`\`

위 항목들을 기반으로 자세하고 건설적인 피드백을 제공해주세요.`
                        }
                    }
                ]
            }
        }
    )

    // 서버 목록 리소스 등록
    server.resource(
        'servers-list',
        'server://list',
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(fakeServers, null, 2)
                    }
                ]
            }
        }
    )

    // 개별 서버 정보 리소스 템플릿 등록
    server.resource(
        'server-info',
        'server://info/{serverId}',
        async (uri) => {
            const serverId = uri.pathname.split('/').pop()
            const serverInfo = fakeServers.find(s => s.id === serverId)
            
            if (!serverInfo) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: 'application/json',
                            text: JSON.stringify({ error: `서버를 찾을 수 없습니다: ${serverId}` })
                        }
                    ]
                }
            }
            
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(serverInfo, null, 2)
                    }
                ]
            }
        }
    )

    // 서버 상태 요약 리소스 등록
    server.resource(
        'servers-status',
        'server://status',
        async (uri) => {
            const statusSummary = {
                total: fakeServers.length,
                running: fakeServers.filter(s => s.status === 'running').length,
                stopped: fakeServers.filter(s => s.status === 'stopped').length,
                maintenance: fakeServers.filter(s => s.status === 'maintenance').length,
                lastUpdated: new Date().toISOString()
            }
            
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(statusSummary, null, 2)
                    }
                ]
            }
        }
    )

    // greeting 도구 등록
    server.tool(
        'greeting',
        '사용자의 이름과 언어를 입력받아 해당 언어로 인사말을 반환합니다.',
        {
            name: z.string().describe('인사할 사용자의 이름'),
            language: z.enum(['korean', 'english', 'japanese', 'chinese', 'spanish', 'french', 'german'])
                .describe('인사말에 사용할 언어 (korean, english, japanese, chinese, spanish, french, german)')
        },
        async ({ name, language }) => {
            const greetingFn = greetings[language]
            
            if (!greetingFn) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `지원하지 않는 언어입니다: ${language}`
                        }
                    ]
                }
            }

            const message = greetingFn(name)
            
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: message
                    }
                ]
            }
        }
    )

    // get_time 도구 등록
    server.tool(
        'get_time',
        '지역 이름을 입력받아 해당 지역의 현재 시간을 반환합니다.',
        {
            region: z.string().describe('시간을 알고 싶은 지역 이름 (예: seoul, 서울, tokyo, 도쿄, new_york, 뉴욕, london, 런던 등)')
        },
        async ({ region }) => {
            const normalizedRegion = region.toLowerCase().trim().replace(/\s+/g, '_')
            const timezone = timezones[normalizedRegion]
            
            if (!timezone) {
                const availableRegions = Object.keys(timezones).join(', ')
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `지원하지 않는 지역입니다: ${region}\n\n지원하는 지역 목록:\n${availableRegions}`
                        }
                    ]
                }
            }

            const now = new Date()
            const options: Intl.DateTimeFormatOptions = {
                timeZone: timezone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }
            
            const formatter = new Intl.DateTimeFormat('ko-KR', options)
            const formattedTime = formatter.format(now)
            
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `📍 ${region} (${timezone})\n🕐 현재 시간: ${formattedTime}`
                    }
                ]
            }
        }
    )

    // calc 도구 등록
    server.tool(
        'calc',
        '두 개의 숫자와 하나의 연산자를 입력받아 계산 결과를 반환합니다.',
        {
            num1: z.number().describe('첫 번째 숫자'),
            num2: z.number().describe('두 번째 숫자'),
            operator: z.enum(['+', '-', '*', '/']).describe('연산자 (+, -, *, /)')
        },
        async ({ num1, num2, operator }) => {
            let result: number

            switch (operator) {
                case '+':
                    result = num1 + num2
                    break
                case '-':
                    result = num1 - num2
                    break
                case '*':
                    result = num1 * num2
                    break
                case '/':
                    if (num2 === 0) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: '오류: 0으로 나눌 수 없습니다.'
                                }
                            ]
                        }
                    }
                    result = num1 / num2
                    break
            }

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `${num1} ${operator} ${num2} = ${result}`
                    }
                ]
            }
        }
    )

    // generate_image 도구 등록
    server.tool(
        'generate_image',
        '텍스트 프롬프트를 입력받아 AI로 이미지를 생성합니다.',
        {
            prompt: z.string().describe('생성할 이미지에 대한 설명 (영어 권장)')
        },
        async ({ prompt }) => {
            try {
                // config에서 hfToken을 가져오거나 환경변수에서 가져옴
                const hfToken = config?.hfToken || process.env.HF_TOKEN
                
                if (!hfToken) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: '오류: Hugging Face API Token이 설정되지 않았습니다. 서버 설정에서 hfToken을 제공하거나 HF_TOKEN 환경변수를 설정해주세요.'
                            }
                        ]
                    }
                }
                
                const client = new InferenceClient(hfToken)
                
                const image = await client.textToImage({
                    provider: 'hf-inference',
                    model: 'black-forest-labs/FLUX.1-schnell',
                    inputs: prompt,
                    parameters: { num_inference_steps: 5 }
                }) as unknown as Blob
                
                // Blob을 ArrayBuffer로 변환 후 base64로 인코딩
                const arrayBuffer = await image.arrayBuffer()
                const base64Data = Buffer.from(arrayBuffer).toString('base64')
                
                return {
                    content: [
                        {
                            type: 'image' as const,
                            data: base64Data,
                            mimeType: 'image/png',
                            annotations: {
                                audience: ['user'],
                                priority: 0.9
                            }
                        }
                    ]
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `이미지 생성 중 오류가 발생했습니다: ${errorMessage}`
                        }
                    ]
                }
            }
        }
    )

    // Must return the MCP server object
    return server
}
