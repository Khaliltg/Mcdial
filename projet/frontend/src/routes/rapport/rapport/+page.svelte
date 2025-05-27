<!-- src/App.svelte -->
<script>
    import { goto } from "$app/navigation";

    // Données des rapports avec URLs
    const reportCategories = [
        {
            title: "Résumé du système",
            icon: "📊",
            reports: [
                { name: "Rapport principal en temps réel", url: "/rapport/RealTimeReport" }
            ],
            colSpan: 2
        },
        {
            title: "Rapports d'agent",
            icon: "👤",
            reports: [
                { name: "Détail du temps de l'agent", url: "/rapport/agent_time_detail" },
                { name: "Statistiques des utilisateurs", url: "/users/stats" },
                
            ],
            colSpan: 1
        },
        {
            title: "Rapports d'horloge de pointage",
            icon: "⏱️",
            reports: [
                { name: "Rapport détaillé de l'horloge utilisateur", url: "/rapport/timeclock-detail" }
            ],
            colSpan: 1
        },
        {
            title: "Rapports d'appels entrants et sortants",
            icon: "📞",
            reports: [
                { name: "Rapport d'appels d'exportation", url: "/rapport/export-calls" },
                { name: "Rapport sur les prospects à l'exportation", url: "/rapport/export-leads" }
            ],
            colSpan: 2
        }
    ];

    function handleReportClick(url) {
        // Utilisation de la fonction goto de SvelteKit pour la navigation
        goto(url);
    }
</script>

<main>
    <div class="header-container">
        <h1>Server Stats and Reports</h1>
        <p class="subtitle">Access and manage all system reports in one place</p>
    </div>
    
    <div class="content">
        {#each reportCategories as category}
            <section class="category-card" style="grid-column: span {category.colSpan}">
                <div class="category-header">
                    <span class="category-icon">{category.icon}</span>
                    <h2>{category.title}</h2>
                </div>
                <ul class="report-list">
                    {#each category.reports as report}
                        <li class="report-item">
                            <a 
                                href={report.url} 
                                on:click|preventDefault={() => handleReportClick(report.url)} 
                                class="report-link"
                            >
                                <span class="report-icon">→</span>
                                <span class="report-name">{report.name}</span>
                                <span class="report-url">{report.url}</span>
                            </a>
                        </li>
                    {/each}
                </ul>
            </section>
        {/each}
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        background-color: #f5f7fa;
        color: #2d3748;
    }

    main {
        font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header-container {
        margin-bottom: 2.5rem;
        text-align: center;
    }

    h1 {
        color: #2c3e50;
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    .subtitle {
        color: #718096;
        font-size: 1.1rem;
        margin-top: 0;
    }

    .content {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .category-card[style*="span 2"] {
        grid-column: span 2;
    }

    .category-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 1.5rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .category-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.2rem;
        padding-bottom: 0.8rem;
        border-bottom: 1px solid #edf2f7;
    }

    .category-icon {
        font-size: 1.5rem;
        margin-right: 0.8rem;
    }

    h2 {
        color: #4a5568;
        font-size: 1.3rem;
        margin: 0;
        font-weight: 500;
    }

    .report-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .report-item {
        margin-bottom: 0.5rem;
    }

    .report-link {
        display: flex;
        align-items: center;
        padding: 0.8rem 1rem;
        color: #4a5568;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.2s ease;
        justify-content: space-between;
    }

    .report-link:hover {
        background-color: #ebf8ff;
        color: #3182ce;
        transform: translateX(3px);
    }

    .report-icon {
        margin-right: 0.8rem;
        color: #3182ce;
        font-weight: bold;
        flex-shrink: 0;
    }

    .report-name {
        flex-grow: 1;
    }

    .report-url {
        color: #a0aec0;
        font-size: 0.85rem;
        margin-left: 1rem;
        font-family: monospace;
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        .content {
            grid-template-columns: 1fr;
        }
        
        .category-card {
            grid-column: span 1 !important;
        }
        
        main {
            padding: 1rem;
        }
        
        .report-link {
            flex-wrap: wrap;
        }
        
        .report-url {
            width: 100%;
            margin-left: 2rem;
            margin-top: 0.3rem;
        }
    }
</style>