
    <footer class="bg-dark text-white py-5 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4 mb-4">
                    <h5 class="fw-bold mb-3">
                        <i class="bi bi-fish"></i> Toloni Pescarias
                    </h5>
                    <p class="text-light">
                        Sua plataforma para compartilhar experiências de pesca e conectar-se com outros pescadores apaixonados.
                    </p>
                    <div class="d-flex gap-3">
                        <a href="#" class="text-white">
                            <i class="bi bi-instagram fs-4"></i>
                        </a>
                        <a href="#" class="text-white">
                            <i class="bi bi-facebook fs-4"></i>
                        </a>
                        <a href="#" class="text-white">
                            <i class="bi bi-youtube fs-4"></i>
                        </a>
                        <a href="mailto:contato@tolonipescarias.com" class="text-white">
                            <i class="bi bi-envelope fs-4"></i>
                        </a>
                    </div>
                </div>
                
                <div class="col-md-2 mb-4">
                    <h6 class="fw-bold mb-3">Links Rápidos</h6>
                    <ul class="list-unstyled">
                        <li><a href="/" class="text-light text-decoration-none">Home</a></li>
                        <li><a href="/pages/locations.php" class="text-light text-decoration-none">Localidades</a></li>
                        <li><a href="/pages/reports.php" class="text-light text-decoration-none">Relatos</a></li>
                        <li><a href="/pages/about.php" class="text-light text-decoration-none">Sobre</a></li>
                        <li><a href="/pages/contact.php" class="text-light text-decoration-none">Contato</a></li>
                    </ul>
                </div>
                
                <div class="col-md-3 mb-4">
                    <h6 class="fw-bold mb-3">Localidades Populares</h6>
                    <?php
                    try {
                        $stmt = $pdo->prepare("SELECT id, name FROM locations WHERE featured = 1 AND approved = 1 LIMIT 5");
                        $stmt->execute();
                        $popular_locations = $stmt->fetchAll();
                    } catch (PDOException $e) {
                        $popular_locations = [];
                    }
                    ?>
                    <ul class="list-unstyled">
                        <?php foreach ($popular_locations as $location): ?>
                            <li>
                                <a href="/pages/location_detail.php?id=<?php echo $location['id']; ?>" 
                                   class="text-light text-decoration-none">
                                    <i class="bi bi-geo-alt"></i> <?php echo htmlspecialchars($location['name']); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                
                <div class="col-md-3 mb-4">
                    <h6 class="fw-bold mb-3">Contato</h6>
                    <address class="text-light">
                        <p><i class="bi bi-envelope"></i> contato@tolonipescarias.com</p>
                        <p>
                            <i class="bi bi-whatsapp"></i>
                            <a href="https://wa.me/5511972225982" class="text-light text-decoration-none">
                                (11) 97222-5982
                            </a>
                        </p>
                        <p><i class="bi bi-clock"></i> Seg-Sex: 9h às 18h<br>Sáb: 9h às 13h</p>
                    </address>
                </div>
            </div>
            
            <hr class="my-4">
            
            <div class="row align-items-center">
                <div class="col-md-6">
                    <p class="mb-0 text-light">
                        © <?php echo date('Y'); ?> Toloni Pescarias. Todos os direitos reservados.
                    </p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="/pages/terms.php" class="text-light text-decoration-none me-3">Termos de Uso</a>
                    <a href="/pages/privacy.php" class="text-light text-decoration-none">Política de Privacidade</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Custom JS -->
    <script src="/assets/js/main.js"></script>
    
    <!-- Notification System -->
    <div id="notification-container" class="position-fixed top-0 end-0 p-3" style="z-index: 11000;">
        <!-- Notifications will be inserted here -->
    </div>
</body>
</html>
