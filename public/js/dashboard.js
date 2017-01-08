const main = function (data) {
    "use strict";

    // FIELDS
    let todosperweek = [];
    const $todosperweekbutton = $(".todosperweekinput");


    $todosperweekbutton.on('click', function (event) {
        $(".tododiv").remove();
        $.get("/todosperweek", function (data) {
            const $todosperweek = $("<div>");
            $todosperweek.addClass('todosperweek');
            data.forEach(function (object) {
                const $week = $("<label>");
                const $count = $("<label>");

                $week.text(object.Week);
                $count.text(object.Count);

                const $tododiv = $("<div>");
                $tododiv.addClass("tododiv");
                $tododiv.append($week);
                $tododiv.append($count);

                $todosperweek.append($tododiv);

            });
            $("main .container").append($todosperweek);
        });
    });
};

$(document).ready(main);
