import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Resource Framework",
  description: "Composable resource table/drilldown framework",
  themeConfig: {
    nav: [
      { text: "Overview", link: "/overview" },
      { text: "Getting Started", link: "/getting-started/" }
    ],
    sidebar: [
      {
        text: "Concepts",
        items: [
          { text: "Overview", link: "/concepts/overview" },
          { text: "Resources", link: "/concepts/resources" },
          { text: "Columns", link: "/concepts/columns" },
          { text: "Filters", link: "/concepts/filters" },
          { text: "Forms", link: "/concepts/forms" },
          { text: "Routes", link: "/concepts/routes" }
        ]
      }
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/XYLEX-Group/resource-framework" }]
  }
});


