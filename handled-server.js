const baseurl = $('base').attr('href');
const refreshToken = $('meta[name="refresh_token"]').attr('content');
const page_name = $('meta[name="page_name"]').attr('content');

$(function () {
     if (checkCookie("X_SCTR_SESSION")) {
          $('#btn-umum').on('click', function () {
               $('#categoriesFav').removeAttr('name');
               $('#categories').attr('name', 'categories');
          });
          $('#btn-favorite').on('click', function () {
               $('#categories').removeAttr('name');
               $('#categoriesFav').attr('name', 'categoriesFav');
          });
          $('.btn-filter').on('click', function () {
               $('.btn-filter').removeClass('active');
               $(this).addClass('active');
               var category = $(this).data('category');
               activateTab('Umum');
               $.ajax({
                    url: baseurl + "ajax/order-filter-category",
                    type: "POST",
                    data: "category=" + category + "&_token=" + refreshToken,
                    dataType: "html",
                    success: function (res) {
                         $('#categories').html(res);
                         var initialCategory = $('#categories').val();
                         fetchServicesForCategory(initialCategory, false, function () {
                              const initialService = $('#services').val();
                              if (initialService) {
                                   handleServiceChange(initialService);
                              }
                         });
                    },
                    error: function (xhr, status, error) {
                         $('#ajax-result').html('<font color="red">Terjadi kesalahan!.</font>');
                    }
               });
          });

          $('#input_template').on('keyup', function () {
               const keyword = $(this).val().trim();
               if (keyword.length > 0) {
                    performSearch(keyword);
               } else {
                    $('#input_template').css("border-bottom-left-radius", "0.625rem");
                    $('#input_template').css("border-bottom-right-radius", "0.625rem");
                    $('#serach_result').html(''); // Kosongkan hasil pencarian jika input kosong
               }
          });

          // Fungsi untuk melakukan pencarian layanan
          function performSearch(keyword) {
               if (keyword.trim() === '') {
                    $('#serach_result').html('');
                    return;
               }
               $.ajax({
                    url: baseurl + 'ajax/order-search-serice',
                    type: 'POST',
                    data: {
                         keywords: keyword,
                         _token: refreshToken
                    },
                    dataType: 'json', // Menggunakan format JSON sebagai response
                    success: function (res) {
                         $('#input_template').css("border-bottom-left-radius", "0px");
                         $('#input_template').css("border-bottom-right-radius", "0px");
                         if (res.status === 'success') {
                              // Jika ada hasil, tampilkan dropdown
                              $('#serach_result').html(res.select2Html).addClass('select2-container--open');
                              // Menambahkan event listener untuk memilih layanan
                              $('.Basic-result').on('click', function () {
                                   $('#input_template').css("border-bottom-left-radius", "0.625rem");
                                   $('#input_template').css("border-bottom-right-radius", "0.625rem");
                                   $('#serach_result').removeClass('select2-container--open');
                                   var serviceId = $(this).data('id'); // Mendapatkan ID layanan
                                   var categoryId = $(this).data('cat'); // Mendapatkan ID kategori
                                   var serviceName = $(this).data('name'); // Mendapatkan nama layanan
                                   // Pilih kategori secara otomatis
                                   $('#categories').val(categoryId).change();
                                   fetchServicesForCategory(categoryId, false, function () {
                                        $('#services').val(serviceId); // Set layanan
                                        handleServiceChange(serviceId); // Tangani layanan yang dipilih
                                   });
                                   // Sembunyikan hasil pencarian setelah klik
                                   $('#input_template').val(serviceName);
                                   $('#serach_result').html('');
                              });
                         } else {
                              // Jika tidak ada hasil, tampilkan pesan
                              $('#input_template').css("border-bottom-left-radius", "0.625rem");
                              $('#input_template').css("border-bottom-right-radius", "0.625rem");
                              $('#serach_result').html('');
                         }
                    },
                    error: function (xhr, status, error) {
                         $('#serach_result').html('<font color="red">Terjadi kesalahan saat mencari layanan.</font>');
                    }
               });
          }

          // Fungsi untuk menangani pemilihan kategori dan mengambil layanan
          function fetchServicesForCategory(categoryId, isFavorite, callback) {
               const url = isFavorite ? `${baseurl}ajax/order-get-service-fav` : `${baseurl}ajax/order-get-service`;
               // Menyusun data yang akan dikirim
               const requestData = {
                    category: categoryId,
                    _token: refreshToken // Token CSRF untuk keamanan
               };
               // Memanggil AJAX dengan parameter yang lebih jelas
               $.ajax({
                    type: "POST",
                    url: url,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         $('#services').html(data);
                         if (typeof callback === 'function') {
                              callback(); // Panggil callback setelah layanan selesai diupdate
                         }
                    },
                    error: function (xhr, status, error) {
                         handleAjaxError('Terjadi kesalahan saat mengambil layanan.');
                    }
               });
          }

          // Fungsi untuk menangani pemilihan layanan dan mengambil detailnya
          function handleServiceChange(serviceId) {
               const requestData = {
                    services: serviceId,
                    _token: refreshToken // Token CSRF untuk keamanan
               };

               // AJAX pertama untuk mengambil detail layanan
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/order-select-service`,
                    data: requestData,
                    dataType: "json",
                    success: function (data) {
                         updateServiceDetails(data);
                    },
                    error: function (xhr, status, error) {
                         handleAjaxError('Terjadi kesalahan saat mengambil detail layanan.');
                    }
               });

               // AJAX kedua untuk mengambil jenis layanan
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/order-service-type`,
                    data: requestData,
                    dataType: "html",
                    success: function (data) {
                         $('#service_type').html(data);
                    },
                    error: function () {
                         handleAjaxError('Terjadi kesalahan saat mengambil jenis layanan.');
                    }
               }).done(function (e) {
                    initializeServiceHandlers();
               });
          }

          // Fungsi untuk memperbarui tampilan detail layanan
          function updateServiceDetails(data) {
               $('#fav').html(data.fav);
               $('#min').html(data.min);
               $('#max').html(data.max);
               $('#average').text(data.average_time);
               $('#price').text(formatPrice(data.price));
               $('#desc').html(data.noted);

               if (data.rating !== 'N/A') {
                    $('#rating').html(`<span class="star">${data.rating}</span> ${data.review.total} dari ${data.review.from} Review`);
               } else {
                    $('#rating').text('N/A');
               }
               $('#refill').html(createBadge(data.refill));
               $('#cancel').html(createBadge(data.cancel));
          }
          function createBadge(status) {
               if (status === 'Yes') {
                    return '<span class="badge text-bg-success"><i class="fas fa-check-circle me-1"></i>Tersedia</span>';
               } else if (status === 'No') {
                    return '<span class="badge text-bg-danger"><i class="fas fa-times-circle me-1"></i>Tidak Tersedia</span>';
               } else {
                    return '<b>N/A</b>';
               }
          }
          // Fungsi untuk memformat harga dengan benar
          function formatPrice(price) {
               return price.replace(/\s*\.\s*/g, '.');
          }

          // Fungsi untuk menangani kesalahan AJAX
          function handleAjaxError(message) {
               $('#ajax-result').html(`<span style="color: red;">${message}</span>`);
          }

          // Fungsi untuk menangani event pengubahan jumlah layanan
          function initializeServiceHandlers() {
               // Menghitung total harga berdasarkan kuantitas layanan
               let totalPriceDelayTimer;
               $('#quantity').keyup(function () {
                    clearTimeout(totalPriceDelayTimer);
                    totalPriceDelayTimer = setTimeout(function () {
                         const service = $('#services').val();
                         let quantity = parseInt($('#quantity').val().replace(/^0+/, ''), 10);
                         if (isNaN(quantity)) {
                              quantity = 0;
                         }
                         $('#quantity').val(quantity);
                         total_price(service, quantity); // Update total harga
                    }, 500);
               });
               // Menangani komentar kustom (untuk komentar terkait layanan)
               handleTextAreaInput('#CustomComments');
               handleTextAreaInput('#MentionsCustomList');
               handleTextAreaInput('#CommentReplies2');
          }
          // Fungsi untuk menangani input textarea dan menghitung harga berdasarkan jumlah
          function handleTextAreaInput(selector) {
               $(selector).keyup(function () {
                    const text = $(this).val().trim();
                    const quantity = text ? text.split("\n").length : 0;
                    $('#quantity').val(quantity);
                    const service = $('#services').val();
                    total_price(service, quantity); // Update total harga
               });
          }
          // Memicu event change untuk kategori yang dipilih (Umum)
          $('#categories').change(function () {
               var category = $(this).val();
               fetchServicesForCategory(category, false, function () {
                    const initialService = $('#services').val();
                    if (initialService) {
                         handleServiceChange(initialService);
                    }
               });
          });
          $('#categoriesFav').change(function () {
               var category = $(this).val();
               fetchServicesForCategory(category, true, function () {
                    const initialService = $('#services').val();
                    if (initialService) {
                         handleServiceChange(initialService);
                    }
               });
          });
          $('#services').change(function () {
               var selectedService = $(this).val();
               handleServiceChange(selectedService); // Panggil fungsi untuk menangani perubahan layanan
          });
          // // Secara otomatis memicu perubahan kategori saat halaman dimuat (bila sudah ada pilihan yang ada)
          var $sessionCategory = $('#categories').data('selected');
          var $sessionCategoryFav = $('#categoriesFav').data('selected');
          var $sessionServices = $('#services').data('selected');

          function activateTab(category) {
               $('.btn-type').removeClass('active');
               if (category === 'Umum') {
                    $('#btn-umum').addClass('active');
                    $('#categories-umum').show();
                    $('#categories-favorite').hide();
               } else if (category === 'Favorite') {
                    $('#btn-favorite').addClass('active');
                    $('#categories-favorite').show();
                    $('#categories-umum').hide();
               }
          }

          if ($sessionCategoryFav) {
               $('#categoriesFav').val($sessionCategoryFav);
               fetchServicesForCategory($sessionCategoryFav, true, function () {
                    $('#services').val($sessionServices);
                    handleServiceChange($sessionServices);
               });
               activateTab('Favorite');
          } else {
               if ($sessionCategory) {
                    $('#categories').val($sessionCategory);
                    fetchServicesForCategory($sessionCategory, false, function () {
                         $('#services').val($sessionServices); // Set layanan
                         handleServiceChange($sessionServices); // Tangani layanan yang dipilih
                    });
               } else {
                    const initialCategory = $('#categories').val();
                    if (initialCategory) {
                         fetchServicesForCategory(initialCategory, false, function () {
                              const initialService = $('#services').val();
                              if (initialService) {
                                   handleServiceChange(initialService);
                              }
                         });
                    }
               }
               activateTab('Umum');
          }

          $('.btn-type').on('click', function () {
               const btnType = $(this).data('category'); // Mengambil nilai data-category
               let initialCategory;
               // Menentukan kategori berdasarkan tipe (Favorite atau Umum)
               if (btnType === 'Favorite') {
                    initialCategory = $('#categoriesFav').val(); // Ambil kategori favorit
               } else {
                    initialCategory = $('#categories').val(); // Ambil kategori umum
               }
               // Pastikan kategori yang dipilih valid
               if (initialCategory) {
                    const isFavorite = (btnType === 'Favorite');
                    fetchServicesForCategory(initialCategory, isFavorite, function () {
                         const initialService = $('#services').val();
                         // Jika ada layanan yang dipilih, panggil fungsi untuk memperbarui layanan
                         if (initialService) {
                              handleServiceChange(initialService);
                         }
                    });
               }
          });

          function total_price(service, quantity) {
               if (Number.isInteger(quantity) == false) {
                    $('#quantity').val(Math.round(quantity));
               }
               $.ajax({
                    type: "POST",
                    url: baseurl + "ajax/order-get-price",
                    dataType: "json",
                    data: "service=" + service + "&quantity=" + quantity + "&_token=" + refreshToken + "",
                    success: function (data) {
                         $('#total_price').text(data.total.replace(/\s*\.\s*/g, '.'));
                    },
                    error: function (xhr, status, error) {
                         $('#total_price').text('N/A');
                    }
               });
          }


          // Fungsi untuk menampilkan hasil produk
          function loadProducts(searchQuery = '', type = 'Exclusive', targetId) {
               // Show loading spinner while waiting for data
               $(targetId).html('<center><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></center>');
               $.ajax({
                    type: "POST",
                    url: baseurl + "ajax/category-list-ppob",
                    data: {
                         category_type: type,
                         category: page_name,
                         _token: refreshToken,
                         search_query: searchQuery
                    },
                    dataType: "html",
                    success: function (data) {
                         $(targetId).html(data);
                         const lazyImages = $(targetId).find('.lazy-image');
                         lazyImages.each(function () {
                              lazyLoadAnimed(this);  // Apply lazy loading
                         });
                         $(targetId).simpleLoadMore({
                              item: '.product-item',
                              count: 12,
                              easing: 'slide',
                              counterInBtn: true,
                              btnHTML: '<center><button type="button" class="load-more__btn btn btn-primary">Tampilkan Lainnya ( {showing} / {total} )</button></center>'
                         });
                    },
                    error: function () {
                         $(targetId).html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
                    }
               });
          }
          loadProducts('', 'Exclusive', '#product_list');
          loadProducts('', 'Promotion', '#product_list_promo');
          // Event listener for search input (optional, if you want to apply search on both categories)
          $('#search-input').on('input', function () {
               var searchQuery = $(this).val().trim(); // Get search query
               if (searchQuery) {
                    loadProducts(searchQuery, 'Exclusive', '#product_list'); // Load Exclusive products based on search
                    loadProducts(searchQuery, 'Promotion', '#product_list_promo'); // Load Promotion products based on search
               } else {
                    loadProducts('', 'Exclusive', '#product_list');  // Load Exclusive without search
                    loadProducts('', 'Promotion', '#product_list_promo');  // Load Promotion without search
               }
          });
          $(".phone_number").on("input", function () {
               var data_number = $(this).val().trim();
               if (data_number === '') {
                    $('#display').addClass('d-none');
                    setTimeout(() => {
                         $("#service_list").html('');
                         $("#oprator-icon").attr("src", '');
                         $('#oprator').addClass('d-none');
                         $('#wartext').html('')
                         $('#service_name').html('N/A');
                         $('#price').html('N/A');
                         $('#note').html('N/A');
                         $('.buy_service').prop('disabled', true);
                    }, 1000)
               } else {
                    if (data_number.length >= 10) {
                         $.ajax({
                              type: 'POST',
                              data: 'phone=' + data_number + '&type=' + page_name + '&_token=' + refreshToken + '',
                              url: baseurl + "ajax/simcard-detector",
                              dataType: 'json',
                              success: function (msg) {
                                   $('#wartext').html('<i class="fas fa-address-book me-1"></i>Pastikan Nomornya Sudah Benar Ya')
                                   $('#display').removeClass('d-none');
                                   $("#service_list").html('<center><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></center>');
                                   setTimeout(() => {
                                        $("#service_list").html(msg.service_list);
                                        $("#oprator-icon").attr("src", msg.oprator);
                                        $('#oprator').removeClass('d-none');
                                        $('.form-number').css("border-top-left-radius", "0px");
                                        $('.form-number').css("border-bottom-left-radius", "0px");
                                        $('#service_list').simpleLoadMore({
                                             item: '.items',
                                             count: 6,
                                             easing: 'slide',
                                             counterInBtn: true,
                                             btnHTML: '<center><button type="button" class="load-more__btn btn btn-primary">Tampilkan Lainnya ( {showing} / {total} )</button></center>'
                                        });
                                        $('input[type=radio][name=service]').change(function () {
                                             $('html').animate({
                                                  scrollTop: $('#data_select').offset().top
                                             }, 500);
                                             var method = $(this).val();
                                             $.ajax({
                                                  type: "POST",
                                                  url: baseurl + "ajax/ppob-select-service",
                                                  data: "method=" + method + "&version=legacy&_token=" + refreshToken + "",
                                                  dataType: "json",
                                                  success: function (data) {
                                                       $('#service_name').html(data.service_name);
                                                       $('#price').html(data.price);
                                                       $('#note').html(data.note);
                                                       $('.buy_service').prop('disabled', false);
                                                       $('#service_id').val(method);
                                                       $('#no-selected').addClass('d-none');
                                                       $('#accordionExample').removeClass('d-none');
                                                       var icon = $('#desktop-icon').attr('src');
                                                       var cat = $('#product_data').data('cat');
                                                       var product = $('#product_data').data('product');
                                                       var price = $('#product_data').data('price');
                                                       $('#mobile-icon').attr('src', icon);
                                                       $('#mobile-product').text(product);
                                                       $('#mobile-cat').text(cat);
                                                       $('#mobile-price').text(price);
                                                       $('#mobile-total').text(price);
                                                  },
                                                  error: function () {
                                                       $('#service_list').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
                                                  },
                                             });
                                        });
                                   }, 1000)
                              }
                         });
                    }
               }
          })
          $('input[type=radio][name=service_ppob]').change(function () {
               $('html').animate({
                    scrollTop: $('#data_select').offset().top
               }, 500);
               var method = $(this).val();
               $.ajax({
                    type: "POST",
                    url: baseurl + "ajax/ppob-select-service",
                    data: "method=" + method + "&version=primary&_token=" + refreshToken + "",
                    dataType: "html",
                    success: function (data) {
                         $('#selected-product').html(data);
                         $('.buy_service').prop('disabled', false);
                         $('#no-selected').addClass('d-none');
                         $('#accordionExample').removeClass('d-none');
                         var icon = $('#desktop-icon').attr('src');
                         var cat = $('#desktop-cat').data('cat');
                         var product = $('#desktop-product').data('product');
                         var price = $('#desktop-price').data('price');
                         $('#mobile-icon').attr('src', icon);
                         $('#mobile-cat').text(cat);
                         $('#mobile-product').text(product);
                         $('#mobile-price').text(price);
                         $('#mobile-total').text(price);
                    },
                    error: function () {
                         $('#selected-product').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
                    },
               });
          });

          // Fungsi untuk mengambil metode deposit berdasarkan kategori
          function fetchDepositCategory(categoryId) {
               const requestData = {
                    category: categoryId,
                    _token: refreshToken // Token CSRF untuk keamanan
               };

               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/deposit-get-method`,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         // Memperbarui tampilan metode deposit
                         $('#depositmethod').html(data);

                         // Pastikan bahwa nilai HTML yang diambil adalah string yang valid
                         const depositMethodHtml = $('#depositmethod').html();

                         // Jika tidak ada metode deposit, reset form dan tampilkan pesan
                         if (depositMethodHtml && depositMethodHtml.trim() === '') {
                              resetForm();
                              $('#depositmethod').html(`
                      <div class="col-md-12">
                          <div class="alert bg-light-danger alert-dismissible fade show" role="alert">
                              <div class="d-flex align-items-center">
                                  <iconify-icon class="bi flex-shrink-0 me-1" icon="line-md:close-circle-filled" width="30" height="30"></iconify-icon>
                                  <span>Metode Pembayaran Deposit Ini Belum Tersedia</span>
                              </div>
                          </div>
                      </div>
                      `);
                         }
                    },
                    error: function (xhr, status, error) {
                         handleAjaxError('Terjadi kesalahan saat mengambil layanan.');
                    }
               });
          }

          // Menangani perubahan kategori deposit
          $('#categories').change(function () {
               const category = $(this).val();
               fetchDepositCategory(category);
          });
          // Inisialisasi dengan kategori yang sudah dipilih sebelumnya
          const initialCategory = $('#categories').val();
          if (initialCategory) {
               fetchDepositCategory(initialCategory);
          }
          // Menangani input jumlah deposit dengan debounce
          let delayTimer;
          $('#post-amount').on('input', function () {
               clearTimeout(delayTimer);
               // Menunggu 500ms sebelum mengirimkan request
               delayTimer = setTimeout(function () {
                    const method = $('input[type=radio][name=method]:checked').val();
                    let amount = parseInt($('#post-amount').val().replace(/^0+/, ''), 10);
                    amount = isNaN(amount) ? 0 : amount;
                    $('#post-amount').val(amount); // Update input value
                    // Mengirimkan permintaan untuk mendapatkan jumlah yang sesuai
                    $.ajax({
                         type: "POST",
                         url: `${baseurl}ajax/deposit-get-amount`,
                         data: {
                              method,
                              amount,
                              _token: refreshToken
                         },
                         dataType: "json",
                         success: function (data) {
                              $('#amount').html(data.amount);
                         },
                         error: function () {
                              $('#ajax-result').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
                         }
                    });
               }, 500);
          });
          function fetchPriceListSpsmed(category, price = '', warranty = '') {
               $('#services_sosmed').html(
                    `<div class="mt-5 mb-5 text-center">
               <div class="spinner-border" style="width: 3rem; height: 3rem" role="status">
                  <span class="sr-only">Loading...</span>
               </div>
               </div>`
               );
               const requestData = {
                    category: category,
                    price: price,
                    warranty: warranty,
                    _token: refreshToken // Token CSRF untuk keamanan
               };
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/sosmed-price-list`,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         setTimeout(() => {
                              $('#services_sosmed').html(data);
                         }, 1000)
                    },
                    error: function (xhr, status, error) {
                         $('#services_sosmed').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          const cat_id = $('#categories_pricelist').val();
          const price = $('#prices').val();
          const warranty = $('#warranty').val();

          if (cat_id || price || warranty) {
               fetchPriceListSpsmed(cat_id, price, warranty);
          }

          $('#categories_pricelist').change(function () {
               const category = $(this).val();
               fetchPriceListSpsmed(category);
          });
          $('#prices').change(function () {
               const cat_id = $('#categories_pricelist').val();
               const price = $('#prices').val();
               const warranty = $('#warranty').val();
               fetchPriceListSpsmed(cat_id, price, warranty);
          });
          $('#warranty').change(function () {
               const cat_id = $('#categories_pricelist').val();
               const price = $('#prices').val();
               const warranty = $('#warranty').val();
               fetchPriceListSpsmed(cat_id, price, warranty);
          });

          function fetchServicesPPOB(provider, callback) {
               const url = `${baseurl}ajax/ppob-get-provider`;
               const requestData = {
                    provider: provider,
                    _token: refreshToken
               };
               $.ajax({
                    type: "POST",
                    url: url,
                    data: requestData,
                    dataType: "html",
                    success: function (data) {
                         $('#service_provider').html(data);
                         if (typeof callback === 'function') {
                              callback();
                         }
                    },
                    error: function (xhr, status, error) {
                         $('#services_ppob').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          function handleServiceProviderChange(service, brand, price = '', status = '') {
               $('#services_ppob').html(
                    `<div class="mt-5 mb-5 text-center">
                     <div class="spinner-border" style="width: 3rem; height: 3rem" role="status">
                            <span class="sr-only">Loading...</span>
                    </div><br>
                    <span class="fw-bold mt-2">Sedang Memuat Data...</span>
                </div>`
               );
               const requestData = {
                    service: service,
                    brand: brand,
                    price: price,
                    status: status,
                    _token: refreshToken // Token CSRF untuk keamanan
               };
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/ppob-select-prvider`,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         setTimeout(() => {
                              $('#services_ppob').html(data);
                         }, 1000)
                    },
                    error: function (xhr, status, error) {
                         $('#services_ppob').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          $('#categories_ppob').change(function () {
               var category = $(this).val();
               fetchServicesPPOB(category, function () {
                    const initialProvider = $('#service_provider').val();
                    if (initialProvider) {
                         const selectedOption = $('#service_provider').find('option:selected');
                         const brand = selectedOption.data('brand');
                         handleServiceProviderChange(initialProvider, brand);
                    }
               });
          });
          $('#service_provider').change(function () {
               const selectedOption = $(this).find('option:selected');
               const brand = selectedOption.data('brand');
               const service = $(this).val();
               handleServiceProviderChange(service, brand);
          });
          $('#prices_ppob').change(function () {
               const initialProvider = $('#service_provider').val();
               const price = $('#prices_ppob').val();
               const product_status = $('#product_status').val();
               if (initialProvider) {
                    const selectedOption = $('#service_provider').find('option:selected');
                    const brand = selectedOption.data('brand');
                    handleServiceProviderChange(initialProvider, brand, price, product_status);
               }
          });
          $('#product_status').change(function () {
               const initialProvider = $('#service_provider').val();
               const price = $('#prices_ppob').val();
               const product_status = $('#product_status').val();
               if (initialProvider) {
                    const selectedOption = $('#service_provider').find('option:selected');
                    const brand = selectedOption.data('brand');
                    handleServiceProviderChange(initialProvider, brand, price, product_status);
               }
          });

          const $categories_ppob = $('#categories_ppob').val();
          const initialBrand = $('#service_provider').data('brand');

          if ($categories_ppob) {
               fetchServicesPPOB($categories_ppob, function () {
                    const initialProvider = $('#service_provider').val();
                    if (initialProvider) {
                         const selectedOption = $('#service_provider').find('option:selected');
                         const brand = selectedOption.data('brand');
                         handleServiceProviderChange(initialProvider, brand);
                    }
               });
          }
     } else {
          function fetchPriceListSpsmed(category, price = '', warranty = '') {
               $('#services_sosmed').html(
                    `<div class="mt-5 mb-5 text-center">
                    <div class="spinner-border" style="width: 3rem; height: 3rem" role="status">
                       <span class="sr-only">Loading...</span>
                    </div>
                    </div>`
               );
               const requestData = {
                    category: category,
                    price: price,
                    warranty: warranty,
                    _token: refreshToken // Token CSRF untuk keamanan
               };
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/sosmed-price-list`,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         setTimeout(() => {
                              $('#services_sosmed').html(data);
                         }, 1000)
                    },
                    error: function (xhr, status, error) {
                         $('#services_sosmed').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          const cat_id = $('#categories_pricelist').val();
          const price = $('#prices').val();
          const warranty = $('#warranty').val();

          if (cat_id || price || warranty) {
               fetchPriceListSpsmed(cat_id, price, warranty);
          }

          $('#categories_pricelist').change(function () {
               const category = $(this).val();
               fetchPriceListSpsmed(category);
          });
          $('#prices').change(function () {
               const cat_id = $('#categories_pricelist').val();
               const price = $('#prices').val();
               const warranty = $('#warranty').val();
               fetchPriceListSpsmed(cat_id, price, warranty);
          });
          $('#warranty').change(function () {
               const cat_id = $('#categories_pricelist').val();
               const price = $('#prices').val();
               const warranty = $('#warranty').val();
               fetchPriceListSpsmed(cat_id, price, warranty);
          });

          function fetchServicesPPOB(provider, callback) {
               const url = `${baseurl}ajax/ppob-get-provider`;
               const requestData = {
                    provider: provider,
                    _token: refreshToken
               };
               $.ajax({
                    type: "POST",
                    url: url,
                    data: requestData,
                    dataType: "html",
                    success: function (data) {
                         $('#service_provider').html(data);
                         if (typeof callback === 'function') {
                              callback();
                         }
                    },
                    error: function (xhr, status, error) {
                         $('#services_ppob').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          function handleServiceProviderChange(service, brand, price = '', status = '') {
               $('#services_ppob').html(
                    `<div class="mt-5 mb-5 text-center">
                          <div class="spinner-border" style="width: 3rem; height: 3rem" role="status">
                                 <span class="sr-only">Loading...</span>
                         </div><br>
                         <span class="fw-bold mt-2">Sedang Memuat Data...</span>
                     </div>`
               );
               const requestData = {
                    service: service,
                    brand: brand,
                    price: price,
                    status: status,
                    _token: refreshToken // Token CSRF untuk keamanan
               };
               $.ajax({
                    type: "POST",
                    url: `${baseurl}ajax/ppob-select-prvider`,
                    data: requestData,
                    dataType: "html", // Respons yang diharapkan berupa HTML
                    success: function (data) {
                         setTimeout(() => {
                              $('#services_ppob').html(data);
                         }, 1000)
                    },
                    error: function (xhr, status, error) {
                         $('#services_ppob').html('<tr><td colspan="12" align="center"><dotlottie-player src="https://lottie.host/04b460c0-0696-402d-bd56-45a9fca51e7e/tl4k3kAq4z.lottie" background="transparent" speed="1" style="width: 300px; height: 300px" loop autoplay></dotlottie-player><h4 class="mb-2 text-danger">Tidak Ada Data</h4></td></tr>');
                    }
               });
          }

          $('#categories_ppob').change(function () {
               var category = $(this).val();
               fetchServicesPPOB(category, function () {
                    const initialProvider = $('#service_provider').val();
                    if (initialProvider) {
                         const selectedOption = $('#service_provider').find('option:selected');
                         const brand = selectedOption.data('brand');
                         handleServiceProviderChange(initialProvider, brand);
                    }
               });
          });
          $('#service_provider').change(function () {
               const selectedOption = $(this).find('option:selected');
               const brand = selectedOption.data('brand');
               const service = $(this).val();
               handleServiceProviderChange(service, brand);
          });
          $('#prices_ppob').change(function () {
               const initialProvider = $('#service_provider').val();
               const price = $('#prices_ppob').val();
               const product_status = $('#product_status').val();
               if (initialProvider) {
                    const selectedOption = $('#service_provider').find('option:selected');
                    const brand = selectedOption.data('brand');
                    handleServiceProviderChange(initialProvider, brand, price, product_status);
               }
          });
          $('#product_status').change(function () {
               const initialProvider = $('#service_provider').val();
               const price = $('#prices_ppob').val();
               const product_status = $('#product_status').val();
               if (initialProvider) {
                    const selectedOption = $('#service_provider').find('option:selected');
                    const brand = selectedOption.data('brand');
                    handleServiceProviderChange(initialProvider, brand, price, product_status);
               }
          });

          const $categories_ppob = $('#categories_ppob').val();
          const initialBrand = $('#service_provider').data('brand');

          if ($categories_ppob) {
               fetchServicesPPOB($categories_ppob, function () {
                    const initialProvider = $('#service_provider').val();
                    if (initialProvider) {
                         const selectedOption = $('#service_provider').find('option:selected');
                         const brand = selectedOption.data('brand');
                         handleServiceProviderChange(initialProvider, brand);
                    }
               });
          }
     }
     const selectedCategory = $('#cat').val();
     if (selectedCategory) {
          updateSubCategory(selectedCategory);
     }
});

function continue_order() {
     var $services = $('#service_id').val();
     var $target   = $('#target').val();
     var $target2  = $('#target2').val();

     $('#select_service').val($services);
     $('#select_target').val($target);
     $('#select_target2').val($target2);

     $('#trx_modal').modal('show');
}
function fav(id) {
     $.ajax({
          url: baseurl + "ajax/service-fav",
          type: "POST",
          dataType: "json",
          data: "id=" + id + "&_token=" + refreshToken + "",
          success: (data) => {
               if (data.result) {
                    $('#fav').html('<a href="javascript:;" class="d-flex align-items-center gap-2" onclick="unfav(' + id + ')">Hapus Dari Favorite<iconify-icon icon="solar:heart-bold" width="24" height="24"></iconify-icon></a>');
               }
          },
          error: () => {
               $('#ajax-result').html('<font color="red">Terjadi kesalahan!.</font>');
          }
     })
}

function unfav(id) {
     $.ajax({
          url: baseurl + "ajax/service-unfav",
          type: "POST",
          dataType: "json",
          data: "id=" + id + "&_token=" + refreshToken + "",
          success: (data) => {
               if (data.result) {
                    $('#fav').html('<a href="javascript:;" class="d-flex align-items-center gap-2" onclick="fav(' + id + ')">Tambah Ke Favorite<iconify-icon icon="solar:heart-outline" width="24" height="24"></iconify-icon></a>');
               }
          },
          error: () => {
               $('#ajax-result').html('<font color="red">Terjadi kesalahan!.</font>');
          }
     })
}
// Fungsi untuk mereset form deposit
function resetForm(data = '') {
     if (data) {
          $('#submit').prop('disabled', false);
          $('#reset').prop('disabled', false);
          $('#noted').removeClass('d-none');
          $('#form-input').removeClass('d-none');
          $('#min_depo').text(data.min_deposit);
          $('#bonus').text(data.bonus);
     } else {
          $('#submit').prop('disabled', true);
          $('#reset').prop('disabled', true);
          $('#noted').addClass('d-none');
          $('#form-input').addClass('d-none');
          $('#min_depo').text('');
          $('#bonus').text('');
          $('#ext_phone').addClass('d-none');
          $('#phone').addClass('d-none');
     }
}

// Fungsi untuk memilih metode deposit
function selectMethod(id) {
     $.ajax({
          type: "POST",
          url: `${baseurl}ajax/deposit-select-method`,
          data: {
               method: id,
               _token: refreshToken
          },
          dataType: "json",
          success: function (data) {
               resetForm(data);
               togglePhoneFields(data);
          },
          error: function (xhr, status, error) {
               $('#ajax-result').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
          }
     });
}

// Fungsi untuk menampilkan atau menyembunyikan kolom telepon jika diperlukan
function togglePhoneFields(data) {
     if (data.ext_phone) {
          $('#ext_phone').removeClass('d-none');
     } else {
          $('#ext_phone').addClass('d-none');
     }

     if (data.phone) {
          $('#phone').removeClass('d-none');
     } else {
          $('#phone').addClass('d-none');
     }
}

function detail_service(id, type) {
     $('#detail_modal_title').html('<i class="fas fa-search me-1"></i>Detail Layanan #' + id);
     $('#detail_modal').modal('show');
     const url = (type === 'sosmed') ? `${baseurl}ajax/service-sosmed-detail` : `${baseurl}ajax/service-ppob-detail`;
     $.ajax({
          type: "POST",
          url: url,
          data: "id=" + id + "&_token=" + refreshToken,
          dataType: "html",
          success: function (data) {
               $('#detail_modal_body').html(data);
          },
          error: function (xhr, status, error) {
               $('#detail_modal_body').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
          },
          beforeSend: function () {
               $('#detail_modal_body').html('<div class="progress mb-0"><div class="progress-bar progress-bar-striped active" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%" role="progressbar"></div></div>');
          }
     });
}

function rating_service(id, type) {
     $('#rating_modal_title').html('<i class="fas fa-star me-1"></i>Rating Layanan #' + id);
     $('#rating_modal').modal('show');
     const url = (type === 'sosmed') ? `${baseurl}ajax/service-sosmed-rating` : `${baseurl}ajax/service-ppob-rating`;
     $.ajax({
          type: "POST",
          url: url,
          data: "id=" + id + "&_token=" + refreshToken,
          dataType: "html",
          success: function (data) {
               $('#rating_modal_body').html(data);
          },
          error: function (xhr, status, error) {
               $('#ajax-result').html('<font color="red">Terjadi kesalahan, jika masalah ini masih berlanjut mohon hubungi Admin.</font>');
          },
          beforeSend: function () {
               $('#rating_modal_body').html('<div class="progress mb-0"><div class="progress-bar progress-bar-striped active" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%" role="progressbar"></div></div>');
          }
     });
}
function checkCookie(name) {
     const cookieArr = document.cookie.split(";");
     for (let i = 0; i < cookieArr.length; i++) {
          const cookiePair = cookieArr[i].trim();
          // Cek apakah nama cookie yang dicari ada
          if (cookiePair.startsWith(name + "=")) {
               return true; // Cookie ditemukan
          }
     }
     return false; // Cookie tidak ditemukan
}

const ticketOption = {
     ORDER: [{
               value: 'REFILL',
               text: 'Isi Ulang Pesanan'
          },
          {
               value: 'SPEED UP',
               text: 'Percepat Pesanan'
          },
          {
               value: 'CANCEL',
               text: 'Batalkan Pesanan'
          }
     ],
     SERVICE: [{
               value: 'RECOMEND',
               text: 'Rekomendasi Layanan'
          },
          {
               value: 'REQUEST',
               text: 'Request Layanan'
          }
     ],
     DEPOSIT: [{
               value: 'APPROVED',
               text: 'Setujui Deposit'
          },
          {
               value: 'ISSUE',
               text: 'Masalah Deposit'
          }
     ],
     RENTAL: [{
               value: 'RENEW',
               text: 'Perpanjang Panel'
          },
          {
               value: 'QUESTION',
               text: 'Pertanyaan Lainnya'
          }
     ],
     SELL_SERVICE: [{
          value: 'YOU PROVIDER',
          text: 'Saya Penyedia Layanan'
     }],
     OTHERS: [{
          value: 'MESSAGE',
          text: 'Pesan'
     }]
};

function updateSubCategory(selectedCategory) {
     const subOptions = ticketOption[selectedCategory];
     $('#subcat').empty();
     if (selectedCategory === 'OTHERS') {
          $('#selecttion').hide();
          $('#inpution').show();
     } else {
          $('#selecttion').show();
          $('#inpution').hide();

          const selectElement = $('#subcat');
          subOptions.forEach(function(ticketOption) {
               selectElement.append('<option value="' + ticketOption.value + '">' + ticketOption.text + '</option>');
          });
     }
}
$('#cat').change(function() {
     const selectedCategory = $(this).val();
     updateSubCategory(selectedCategory);
});

// Function to truncate file name if it's too long
function truncateFileName(fileName, maxLength = 10) {
     const fileExt = fileName.split('.').pop(); // Get file extension
     const baseName = fileName.substring(0, fileName.lastIndexOf('.')); // Get base name without extension

     if (baseName.length > maxLength) {
          return baseName.substring(0, maxLength) + '...' + '.' + fileExt; // Truncate and add ellipsis with extension
     }
     return fileName; // Return full name if it's short enough
}

// Listen for file selection event
$('#mod-flup').on('change', function() {
     var fileName = this.files[0]?.name; // Get the name of the selected file
     if (fileName) {
          var truncatedName = truncateFileName(fileName);
          $('#file-info').removeClass('d-none');
          $('#file-name').text(truncatedName);
     }
});

// Reset file input and hide the file name and reset button
$('#reset-file').on('click', function() {
     $('#mod-flup').val(''); // Clear the file input
     $('#file-info').addClass('d-none'); // Hide the file info container
});