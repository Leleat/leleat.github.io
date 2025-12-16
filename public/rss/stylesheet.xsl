<?xml version="1.0" encoding="utf-8"?>
<!--
Based on https://github.com/genmon/aboutfeeds/blob/cd0788cb9f8cfa4edf7f88226586d314078b152a/tools/pretty-feed-v3.xsl
-->
<xsl:stylesheet version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
            <head>
                <title>
                    RSS Feed (Blog) | Anh Tuan Le (@Leleat)
                </title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <style type="text/css">
                    *,
                    *::before,
                    *::after {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        font-family: 'Inter', 'Roboto', sans-serif;
                        line-height: 1.5;
                    }

                    :root {
                        --color-background: #111217;
                        --color-yellow: #ffee6c;
                        --color-rose: #d0316e;
                        --color-text: #cfcfe6;
                        --color-border: #333;
                        --color-text-dim: #818393;
                        --max-inline-size: 80ch;

                        background-color: var(--color-background);
                        color: var(--color-text);

                        :focus-visible {
                            outline: 3px solid var(--color-rose);
                            outline-offset: 2px;
                        }
                    }

                    #RSSicon {
                        margin-inline-end: 0.5rem;
                    }

                    .body {
                        max-inline-size: var(--max-inline-size);
                        margin: 0 auto;
                        padding: 2rem;
                    }

                    .description {
                        margin-block-end: 1rem;
                    }

                    .header {
                        padding: 1.5rem 0;
                    }

                    .info-box {
                        background-color: var(--color-yellow);
                        color: var(--color-border);
                        text-align: center;
                        margin-block-end: 2rem;

                        p {
                            max-inline-size: var(--max-inline-size);
                            margin: 0 auto;
                            padding: 0.75rem 1rem;
                        }
                    }

                    .recent-item {
                        padding-block-end: 1.5rem;
                    }

                    a {
                        color: var(--color-yellow);
                        text-decoration: dotted underline;
                    }

                    a:hover {
                        text-decoration: none;
                    }

                    h1 {
                        font-size: 2rem;
                        font-weight: 600;
                        margin-block-end: 3rem;
                    }

                    h2 {
                        font-size: 1.75rem;
                        font-weight: 600;
                        margin-block-start: 1.5rem;
                        margin-block-end: 1rem;
                    }

                    small {
                        color: var(--color-text-dim);
                    }
                </style>
            </head>
            <body>
                <nav class="info-box">
                    <p>
                        <strong>This is an RSS feed.</strong> Subscribe by copying the URL into your newsreader.
                    </p>
                </nav>
                <div class="body">
                    <header class="header">
                        <h1>
                            <!-- https://commons.wikimedia.org/wiki/File:Feed-icon.svg -->
                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="vertical-align: text-bottom; width: 1.2em; height: 1.2em;" id="RSSicon" viewBox="0 0 256 256">
                                <defs>
                                    <linearGradient x1="0.085" y1="0.085" x2="0.915" y2="0.915" id="RSSg">
                                        <stop offset="0.0" stop-color="#E3702D" />
                                        <stop offset="0.1071" stop-color="#EA7D31" />
                                        <stop offset="0.3503" stop-color="#F69537" />
                                        <stop offset="0.5" stop-color="#FB9E3A" />
                                        <stop offset="0.7016" stop-color="#EA7C31" />
                                        <stop offset="0.8866" stop-color="#DE642B" />
                                        <stop offset="1.0" stop-color="#D95B29" />
                                    </linearGradient>
                                </defs>
                                <rect width="256" height="256" rx="55" ry="55" x="0" y="0" fill="#CC5D15" />
                                <rect width="246" height="246" rx="50" ry="50" x="5" y="5" fill="#F49C52" />
                                <rect width="236" height="236" rx="47" ry="47" x="10" y="10" fill="url(#RSSg)" />
                                <circle cx="68" cy="189" r="24" fill="#FFF" />
                                <path d="M160 213h-34a82 82 0 0 0 -82 -82v-34a116 116 0 0 1 116 116z" fill="#FFF" />
                                <path d="M184 213A140 140 0 0 0 44 73 V 38a175 175 0 0 1 175 175z" fill="#FFF" />
                            </svg>
                            Feed Preview
                        </h1>
                        <h2>
                            <xsl:value-of select="/rss/channel/title" />
                        </h2>
                        <p class="description">
                            <xsl:value-of select="/rss/channel/description" />
                        </p>
                        <a target="_blank">
                            <xsl:attribute name="href">
                                <xsl:value-of select="/rss/channel/link" />
                            </xsl:attribute>
                            Visit Website &#x2192;
                        </a>
                    </header>
                    <h2>Recent Items</h2>
                    <xsl:for-each select="/rss/channel/item">
                        <div class="recent-item">
                            <h3>
                                <a target="_blank">
                                    <xsl:attribute name="href">
                                        <xsl:value-of select="link" />
                                    </xsl:attribute>
                                    <xsl:value-of select="title" />
                                </a>
                            </h3>
                            <small>
                                Published: <xsl:value-of select="pubDate" />
                            </small>
                        </div>
                    </xsl:for-each>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
