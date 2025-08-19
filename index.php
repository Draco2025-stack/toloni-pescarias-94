
<?php
session_start();
require_once 'config/database.php';
require_once 'config/security.php';
require_once 'includes/header.php';

// Buscar dados para a homepage
try {
    $stmt = $pdo->prepare("SELECT * FROM admin_media WHERE active = 1 ORDER BY created_at DESC");
    $stmt->execute();
    $carousel_items = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM locations WHERE featured = 1 AND approved = 1 ORDER BY created_at DESC LIMIT 6");
    $stmt->execute();
    $featured_locations = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT r.*, u.name as user_name, l.name as location_name 
                          FROM reports r 
                          LEFT JOIN users u ON r.user_id = u.id 
                          LEFT JOIN locations l ON r.location_id = l.id 
                          WHERE r.featured = 1 AND r.approved = 1 AND r.is_public = 1 
                          ORDER BY r.created_at DESC LIMIT 3");
    $stmt->execute();
    $featured_reports = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log("Homepage query error: " . $e->getMessage());
    $carousel_items = [];
    $featured_locations = [];
    $featured_reports = [];
}
?>

<main>
    <!-- Hero Carousel -->
    <section class="hero-carousel">
        <div id="heroCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                <?php if (!empty($carousel_items)): ?>
                    <?php foreach ($carousel_items as $index => $item): ?>
                        <div class="carousel-item <?php echo $index === 0 ? 'active' : ''; ?>">
                            <?php if ($item['type'] === 'image'): ?>
                                <img src="<?php echo htmlspecialchars($item['url']); ?>" 
                                     class="d-block w-100 hero-image" 
                                     alt="<?php echo htmlspecialchars($item['alt_text']); ?>">
                            <?php else: ?>
                                <video class="d-block w-100 hero-video" autoplay muted loop>
                                    <source src="<?php echo htmlspecialchars($item['url']); ?>" type="video/mp4">
                                </video>
                            <?php endif; ?>
                            <div class="carousel-caption d-none d-md-block">
                                <h1 class="display-4 fw-bold"><?php echo htmlspecialchars($item['title']); ?></h1>
                                <p class="lead">Compartilhe suas experiências de pesca</p>
                                <a href="auth/register.php" class="btn btn-primary btn-lg">Comece Agora</a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="carousel-item active">
                        <img src="https://images.unsplash.com/photo-1441260038675-7329ab4cc264?w=1600" 
                             class="d-block w-100 hero-image" 
                             alt="Pesca no Rio Amazonas">
                        <div class="carousel-caption d-none d-md-block">
                            <h1 class="display-4 fw-bold">Toloni Pescarias</h1>
                            <p class="lead">Compartilhe suas experiências de pesca</p>
                            <a href="auth/register.php" class="btn btn-primary btn-lg">Comece Agora</a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
            
            <?php if (count($carousel_items) > 1): ?>
                <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            <?php endif; ?>
        </div>
    </section>

    <!-- Localidades em Destaque -->
    <section class="featured-locations py-5">
        <div class="container">
            <h2 class="text-center mb-5">Localidades em Destaque</h2>
            <div class="row">
                <?php foreach ($featured_locations as $location): ?>
                    <div class="col-md-4 mb-4">
                        <div class="card location-card h-100">
                            <?php if ($location['image_url']): ?>
                                <img src="<?php echo htmlspecialchars($location['image_url']); ?>" 
                                     class="card-img-top" 
                                     alt="<?php echo htmlspecialchars($location['name']); ?>">
                            <?php endif; ?>
                            <div class="card-body">
                                <h5 class="card-title"><?php echo htmlspecialchars($location['name']); ?></h5>
                                <p class="card-text"><?php echo htmlspecialchars(substr($location['description'], 0, 150)); ?>...</p>
                                <a href="pages/location_detail.php?id=<?php echo $location['id']; ?>" 
                                   class="btn btn-outline-primary">Ver Detalhes</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="text-center mt-4">
                <a href="pages/locations.php" class="btn btn-primary btn-lg">Ver Todas as Localidades</a>
            </div>
        </div>
    </section>

    <!-- Relatos Recentes -->
    <section class="featured-reports py-5 bg-light">
        <div class="container">
            <h2 class="text-center mb-5">Relatos Recentes</h2>
            <div class="row">
                <?php foreach ($featured_reports as $report): ?>
                    <div class="col-md-4 mb-4">
                        <div class="card report-card h-100">
                            <?php if ($report['images']): 
                                $images = json_decode($report['images'], true);
                                if (!empty($images)): ?>
                                    <img src="<?php echo htmlspecialchars($images[0]); ?>" 
                                         class="card-img-top" 
                                         alt="<?php echo htmlspecialchars($report['title']); ?>">
                                <?php endif; 
                            endif; ?>
                            <div class="card-body">
                                <h5 class="card-title"><?php echo htmlspecialchars($report['title']); ?></h5>
                                <p class="card-text text-muted small">
                                    Por <?php echo htmlspecialchars($report['user_name']); ?> • 
                                    <?php echo date('d/m/Y', strtotime($report['created_at'])); ?>
                                </p>
                                <p class="card-text"><?php echo htmlspecialchars(substr($report['content'], 0, 120)); ?>...</p>
                                <a href="pages/report_detail.php?id=<?php echo $report['id']; ?>" 
                                   class="btn btn-outline-primary">Ler Mais</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="text-center mt-4">
                <a href="pages/reports.php" class="btn btn-primary btn-lg">Ver Todos os Relatos</a>
            </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="cta-section py-5 bg-primary text-white">
        <div class="container text-center">
            <h2 class="mb-4">Pronto para Compartilhar sua Experiência?</h2>
            <p class="lead mb-4">Junte-se à nossa comunidade de pescadores apaixonados</p>
            <div class="d-flex gap-3 justify-content-center">
                <a href="auth/register.php" class="btn btn-light btn-lg">Criar Conta</a>
                <a href="pages/contact.php" class="btn btn-outline-light btn-lg">Entre em Contato</a>
            </div>
        </div>
    </section>
</main>

<?php require_once 'includes/footer.php'; ?>
