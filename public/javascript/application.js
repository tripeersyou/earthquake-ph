$(document).ready(function(){
    $('select.dropdown').dropdown();
    $('#customizeMap').click(function(){
        $('.ui.modal').modal('show');
    });
    $('input[name="daterange"]').daterangepicker();
});